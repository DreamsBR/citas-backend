import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('test')
  @ApiOperation({ summary: 'Probar webhook de n8n (testing)' })
  @ApiResponse({ status: 200, description: 'Webhook enviado' })
  async testWebhook(@Body() data: any) {
    await this.webhooksService.triggerWebhook(
      data.event || 'test.event',
      data.payload || { test: true },
    );
    return { message: 'Webhook test sent' };
  }
}
