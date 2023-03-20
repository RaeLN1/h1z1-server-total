export class DiscordHook {
    public static sendMessageOnIpChannel(message: string) {
        this.sendMessage(message, process.env.IP_WEBHOOK);
    }

    public static sendMessageOnBanChannel(message: string) {
        this.sendMessage(message, process.env.BAN_WEBHOOK);
    }

    private static sendMessage(message: string, webhookUrl?: string) {
        if (!webhookUrl) return;
        const { Webhook } = require("discord-webhook-node");
        const hook = new Webhook(webhookUrl);
    
        hook.send(message);
    }
}