import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AiAssistantService } from 'src/shared/modules/ai-assistant/ai-assistant.service';
import { Repository } from 'typeorm';

import { IntegrationPlatform } from '../integration-platform/entities/integration-platform.entity';
import { DraftResponseDefaultRules } from '../zendesk/constants/draft-response.contant';

import { TicketAnalyzeTags } from './constants/ticket-analyze.constants';
import { buildDraftResponsePrompt, buildFormalizePrompt } from './libs/helpers/response-toolbox.helper';
import {
  buildTicketAnalysisPrompt,
  calculateAverageResponseTime,
  calculateLastMessageTime,
} from './libs/helpers/ticket-sidebar.helper';
import { extractTagValues, htmlToPlainText, markdownToHtml } from './libs/utils';
import { ChatMessage } from './types/tiktokshop.type';

@Injectable()
export class TiktokshopService {
  constructor(
    private aiAssistantService: AiAssistantService,
    @InjectRepository(IntegrationPlatform) private integrationPlatformRepository: Repository<IntegrationPlatform>
  ) {}

  async generateResponse(content: string) {
    return await this.aiAssistantService.askAssistant(content);
  }

  async generateDraftResponse(conversation: ChatMessage[], domain: string): Promise<string> {
    const integrationPlatform = await this.integrationPlatformRepository.findOne({
      where: { domain },
      relations: ['assistant', 'assistant.config', 'assistant.rules', 'assistant.responseTemplates'],
    });

    if (!integrationPlatform) {
      throw new NotFoundException('Integration platform not found');
    }

    const { assistant } = integrationPlatform;
    const { language, toneOfAI, includeReference, enableTemplate } = assistant.config.values;
    let rules = assistant.rules.map((r) => r.content);
    if (!rules.length) {
      rules = Object.values(DraftResponseDefaultRules);
    }

    let template;
    const { responseTemplates } = assistant;

    if (enableTemplate) {
      template =
        responseTemplates.length > 0
          ? assistant.responseTemplates.find((template) => template.isActive)?.template ||
            `Hello,\n\nThank you for reaching out to us.{YOUR CONTENT GO HERE}.\n\nBest regards`
          : `Hello,\n\nThank you for reaching out to us.{YOUR CONTENT GO HERE}.\n\nBest regards`;
    }

    const prompt = buildDraftResponsePrompt(conversation, language, toneOfAI, rules, includeReference, template);
    const result = await this.aiAssistantService.askAssistant(prompt);
    const match = result.match(/<final_answer>([\s\S]*?)<\/final_answer>/i);
    if (!match) {
      throw new InternalServerErrorException('Internal server error');
    }

    const finalAnswer = match[1].trim();
    const html = markdownToHtml(finalAnswer);
    const plainText = htmlToPlainText(html);
    return plainText;
  }

  async generateFormalizeResponse(conversation: ChatMessage[], givenText: string, variant: string) {
    const lastMessage = buildFormalizePrompt(conversation, givenText, variant);
    const result = await this.aiAssistantService.askAssistant(lastMessage);
    const html = markdownToHtml(result);
    const plainText = htmlToPlainText(html);
    return plainText;
  }

  async generateAnalyzeTicket(conversation: ChatMessage[], domain: string) {
    const integrationPlatform = await this.integrationPlatformRepository.findOne({
      where: { domain },
      relations: ['assistant', 'assistant.config'],
    });

    if (!integrationPlatform) {
      throw new NotFoundException('Integration platform not found');
    }

    const { assistant } = integrationPlatform;

    const commentsCount = conversation.length;
    const averageResponseTime = calculateAverageResponseTime(conversation);
    const lastMessageTime = calculateLastMessageTime(conversation);

    const message = buildTicketAnalysisPrompt(conversation);
    const result = await this.aiAssistantService.askAssistant(message);

    const summaryValues = extractTagValues(result, TicketAnalyzeTags.SUMMARY);
    const toneValues = extractTagValues(result, TicketAnalyzeTags.TONE);
    const satisfactionValues = extractTagValues(result, TicketAnalyzeTags.SATISFACTION);
    const purchasingPotentialValues = extractTagValues(result, TicketAnalyzeTags.PURCHASING_POTENTIAL);
    const purchasingPotentialReason = extractTagValues(result, TicketAnalyzeTags.PURCHASING_POTENTIAL_REASON);
    const agentToneValues = extractTagValues(result, TicketAnalyzeTags.AGENT_TONE);
    const urgencyValues = extractTagValues(result, TicketAnalyzeTags.URGENCY);

    return {
      isAutoResponse: assistant.config.values.autoResponse,
      commentsCount,
      averageResponseTime,
      lastMessageTime,
      sentiment: {
        tone: toneValues[0],
        satisfaction: satisfactionValues[0],
        purchasing_potential: purchasingPotentialValues[0],
        purchasing_potential_reason: purchasingPotentialReason[0],
        agent_tone: agentToneValues[0],
        urgency: urgencyValues[0],
      },
      summary: summaryValues[0],
    };
  }
}
