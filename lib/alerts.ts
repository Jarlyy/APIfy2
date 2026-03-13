export interface AlertPayload {
  monitorName: string
  url: string
  statusCode: number | null
  responseTimeMs: number | null
  errorMessage?: string | null
}

interface AlertChannel {
  type: 'slack' | 'telegram' | 'email'
  config: Record<string, string>
}

async function sendSlackAlert(webhookUrl: string, payload: AlertPayload) {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🔴 APIfy monitor failed: ${payload.monitorName}\nURL: ${payload.url}\nStatus: ${payload.statusCode ?? 'n/a'}\nTime: ${payload.responseTimeMs ?? 'n/a'} ms\nError: ${payload.errorMessage || 'n/a'}`,
    }),
  })
}

async function sendTelegramAlert(botToken: string, chatId: string, payload: AlertPayload) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: `🔴 APIfy monitor failed\n${payload.monitorName}\n${payload.url}\nStatus: ${payload.statusCode ?? 'n/a'}\nTime: ${payload.responseTimeMs ?? 'n/a'} ms\nError: ${payload.errorMessage || 'n/a'}`,
    }),
  })
}

async function sendEmailAlert(resendApiKey: string, from: string, to: string, payload: AlertPayload) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `APIfy alert: ${payload.monitorName}`,
      html: `<p><b>Monitor failed</b></p>
             <p><b>Name:</b> ${payload.monitorName}</p>
             <p><b>URL:</b> ${payload.url}</p>
             <p><b>Status:</b> ${payload.statusCode ?? 'n/a'}</p>
             <p><b>Time:</b> ${payload.responseTimeMs ?? 'n/a'} ms</p>
             <p><b>Error:</b> ${payload.errorMessage || 'n/a'}</p>`,
    }),
  })
}

export async function sendAlert(channel: AlertChannel, payload: AlertPayload) {
  switch (channel.type) {
    case 'slack':
      if (!channel.config.webhookUrl) return
      await sendSlackAlert(channel.config.webhookUrl, payload)
      return
    case 'telegram':
      if (!channel.config.botToken || !channel.config.chatId) return
      await sendTelegramAlert(channel.config.botToken, channel.config.chatId, payload)
      return
    case 'email':
      if (!channel.config.resendApiKey || !channel.config.from || !channel.config.to) return
      await sendEmailAlert(channel.config.resendApiKey, channel.config.from, channel.config.to, payload)
      return
    default:
      return
  }
}
