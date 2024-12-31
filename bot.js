const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Bot tokeninizi buraya yazın
const TOKEN = 'YOUR_BOT_TOKEN';

client.once('ready', () => {
    console.log(`✅ Bot ${client.user.tag} olarak giriş yaptı!`);
});

client.on('messageCreate', async (message) => {
    if (message.content === '/imagecopy') {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ Bu komutu kullanmak için yetkiniz yok!');
        }

        const channel = message.channel;
        const imagesDir = path.join(__dirname, 'images');

        // Klasör yoksa oluştur
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir);
        }

        let imageCount = 0;
        let lastMessageID = null; // Önceki mesaj ID'si için değişken

        try {
            while (true) {
                const messages = await channel.messages.fetch({ 
                    limit: 100, 
                    before: lastMessageID 
                });

                if (messages.size === 0) break; // Mesajlar bittiğinde döngüyü sonlandır

                for (const [_, msg] of messages) {
                    if (msg.attachments.size > 0) {
                        for (const attachment of msg.attachments.values()) {
                            if (attachment.contentType && attachment.contentType.startsWith('image')) {
                                const response = await axios.get(attachment.url, {
                                    responseType: 'arraybuffer'
                                });

                                const imagePath = path.join(imagesDir, `${Date.now()}_${attachment.name}`);
                                fs.writeFileSync(imagePath, response.data);

                                console.log(`📥 Görsel kaydedildi: ${attachment.name}`);
                                imageCount++;
                            }
                        }
                    }
                }

                // Sonraki mesajın ID'sini ayarla
                lastMessageID = messages.last().id;
            }

            message.reply(`✅ Toplam ${imageCount} görsel başarıyla indirildi ve 'images' klasörüne kaydedildi!`);
        } catch (error) {
            console.error('❌ Hata:', error);
            message.reply('❌ Görseller indirilirken bir hata oluştu.');
        }
    }
});

client.login(TOKEN);
