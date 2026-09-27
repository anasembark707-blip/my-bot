const { Client, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// الأيديات المعتمدة لمدينة الرياض
const ROLE_ADMIN = '1553725517688217612';       // رتبة الفريق الإداري
const ROLE_BLACKLIST = '1553725700631166987';   // رتبة تصريح اللعب (البلاك ليست)
const ROLE_UNVERIFIED = '1553725832000966657';  // رتبة غير مفعل
const CATEGORY_TICKETS = '1553517079636742164'; // كاتجري التذاكر
const CHANNEL_LOG = '1553726188470669342';      // روم اللوج
const PREFIX_TAG = '𝐌𝐑 |';                      // الزخرفة الرسمية

client.once('ready', () => {
    console.log(`Bot is online as ${client.user.tag}! Riyadh City Bot is ready.`);
});

// نظام التذاكر والتفعيل
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // أمر إرسال رسالة التذاكر والتفعيل (يمكن وضعه في روم مخصص)
    if (message.content === '!setup') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ هذا الأمر خاص بالمسؤولين فقط.');
        }

        const embed = new EmbedBuilder()
            .setTitle('مدينة الرياض | نظام التذاكر والتفعيل')
            .setDescription('مرحباً بك في مدينة الرياض 🇸🇦\nاختر أحد الخيارات بالأسفل لفتح تكرة أو طلب الخدمة المطلوبة:')
            .setColor(0x00A8FF)
            .setFooter({ text: 'جميع الحقوق محفوظة لمدينة الرياض' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_ticket')
                .setLabel('فتح تذكرة')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🎫'),
            new ButtonBuilder()
                .setCustomId('request_verification')
                .setLabel('طلب تفعيل')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✔️')
        );

        await message.channel.send({ embeds: [embed], components: [row] });
        await message.delete();
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    // زر فتح تذكرة عامة
    if (interaction.customId === 'open_ticket') {
        const guild = interaction.guild;
        const member = interaction.member;

        // التحقق من البلاك ليست (تصريح اللعب)
        if (member.roles.cache.has(ROLE_BLACKLIST)) {
            return interaction.reply({ content: '❌ عذراً، أنت محظور (بلاك ليست) ولا يمكنك فتح تذكرة.', ephemeral: true });
        }

        const channelName = `تذكرة-${member.user.username}`;
        
        try {
            const ticketChannel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: CATEGORY_TICKETS,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: member.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    },
                    {
                        id: ROLE_ADMIN,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    }
                ],
            });

            const ticketEmbed = new EmbedBuilder()
                .setTitle('🎫 تذكرة جديدة')
                .setDescription(`أهلاً بك يا ${member}\nالرجاء توضيح مشكلتك أو طلبك وسيقوم الإداري بالرد عليك في أقرب وقت.`)
                .setColor(0x2ECC71);

            const closeRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('إغلاق التذكرة')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒')
            );

            await ticketChannel.send({ content: `${member} <@&${ROLE_ADMIN}>`, embeds: [ticketEmbed], components: [closeRow] });
            await interaction.reply({ content: `✅ تم فتح تذكرتك بنجاح: ${ticketChannel}`, ephemeral: true });

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ حدث خطأ أثناء إنشاء التذكرة، حاول مرة أخرى.', ephemeral: true });
        }
    }

    // زر طلب التفعيل (إزالة رتبة غير مفعل والتحقق من البلاك ليست)
    if (interaction.customId === 'request_verification') {
        const member = interaction.member;

        // التحقق من البلاك ليست
        if (member.roles.cache.has(ROLE_BLACKLIST)) {
            return interaction.reply({ content: '❌ عذراً، أنت موجود في قائمة الحظر (البلاك ليست) ولا يمكنك طلب التفعيل.', ephemeral: true });
        }

        try {
            // إزالة رتبة غير مفعل إن وجدت
            if (member.roles.cache.has(ROLE_UNVERIFIED)) {
                await member.roles.remove(ROLE_UNVERIFIED);
            }

            // إرسال لوج بعملية التفعيل
            const logChannel = interaction.guild.channels.cache.get(CHANNEL_LOG);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('📝 سجل التفعيل')
                    .setDescription(`العضو: ${member} (${member.user.tag})\nقام بطلب التفعيل بنجاح.`)
                    .setColor(0xF1C40F)
                    .setTimestamp();
                await logChannel.send({ embeds: [logEmbed] });
            }

            await interaction.reply({ content: '✅ تم معالجة طلب التفعيل بنجاح!', ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ حدث خطأ أثناء معالجة طلب التفعيل.', ephemeral: true });
        }
    }

    // زر إغلاق التذكرة
    if (interaction.customId === 'close_ticket') {
        const channel = interaction.channel;
        await interaction.reply({ content: '🔒 جاري إغلاق التذكرة وحذفها خلال 5 ثوانٍ...' });
        setTimeout(async () => {
            try {
                await channel.delete();
            } catch (err) {
                console.error(err);
            }
        }, 5000);
    }
});

// سحب التوكن بأمان من إعدادات الموقع أو وضعه هنا مؤقتاً للاستضافة
client.login(process.env.TOKEN || "حط_التوكن_هنا_مؤقتاً");