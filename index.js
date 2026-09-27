const { Client, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// الأيديات المعتمدة لمدينة الرياض (مطابقة 100%)
const ROLE_ADMIN = '1553725517688217612';       // رتبة الفريق الإداري
const ROLE_BLACKLIST = '1553725700631166987';   // رتبة تصريح اللعب (البلاك ليست)
const ROLE_UNVERIFIED = '1553725832000966657';  // رتبة غير مفعل
const CATEGORY_TICKETS = '1553517079636742164'; // كاتجري التذاكر
const CHANNEL_LOG = '1553726188470669342';      // روم اللوج

// قاعدة بيانات مؤقتة للنقاط
const pointsDB = new Map();

client.once('ready', () => {
    console.log(`Bot is online as ${client.user.tag}! Riyadh City Bot is fully fixed.`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const args = message.content.split(' ');
    const command = args[0];

    // أمر إرسال لوحة التذاكر والتفعيل الشاملة (!setup)
    if (command === '!setup') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ هذا الأمر خاص بالمسؤولين فقط.');
        }

        const embed = new EmbedBuilder()
            .setTitle('مدينة الرياض | اللوحة الرئيسية الشاملة')
            .setDescription('مرحباً بك في سيرفر مدينة الرياض 🇸🇦\nاختر أحد الخيارات بالأسفل حسب طلبك (فتح تذكرة، طلب تفعيل، أو الأسئلة والاستفسارات):')
            .setColor(0x00A8FF)
            .setFooter({ text: 'مدينة الرياض - جميع الحقوق محفوظة' });

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
                .setEmoji('✔️'),
            new ButtonBuilder()
                .setCustomId('faq_info')
                .setLabel('الأسئلة والروابط')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('❓')
        );

        await message.channel.send({ embeds: [embed], components: [row] });
        try { await message.delete(); } catch (e) {}
    }

    // أوامر نظام النقاط
    if (command === '!points') {
        const target = message.mentions.members.first() || message.member;
        const points = pointsDB.get(target.id) || 0;
        return message.reply(`⭐ العضو ${target} لديه **${points}** نقطة.`);
    }

    if (command === '!addpoints') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ هذا الأمر خاص بالمسؤولين فقط.');
        }
        const target = message.mentions.members.first();
        const amount = parseInt(args[2]);

        if (!target || isNaN(amount)) {
            return message.reply('❌ الاستخدام الصحيح: `!addpoints @العضو العدد`');
        }

        const currentPoints = pointsDB.get(target.id) || 0;
        pointsDB.set(target.id, currentPoints + amount);

        return message.reply(`✅ تم إضافة **${amount}** نقطة إلى ${target}. المجموع الحالي: **${currentPoints + amount}** نقطة.`);
    }

    if (command === '!resetpoints') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ هذا الأمر خاص بالمسؤولين فقط.');
        }
        const target = message.mentions.members.first();
        if (!target) {
            return message.reply('❌ الاستخدام الصحيح: `!resetpoints @العضو`');
        }

        pointsDB.set(target.id, 0);
        return message.reply(`🔄 تم تصفير نقاط العضو ${target} بنجاح وأصبحت **0**.`);
    }
});

// تفاعل الأزرار الشامل
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    // زر فتح التذكرة
    if (interaction.customId === 'open_ticket') {
        const guild = interaction.guild;
        const member = interaction.member;

        if (member.roles.cache.has(ROLE_BLACKLIST)) {
            return interaction.reply({ content: '❌ عذراً، أنت محظور (بلاك ليست) ولا يمكنك فتح تذكرة.', ephemeral: true });
        }

        const channelName = `تذكرة-${member.user.username}`.toLowerCase();
        
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
                    },
                ],
            });

            const ticketEmbed = new EmbedBuilder()
                .setTitle('🎫 تذكرة جديدة - مدينة الرياض')
                .setDescription(`أهلاً بك يا ${member}\nاشرح مشكلتك أو طلبك هنا بالتفصيل، وسيقوم الفريق الإداري بالرد عليك قريباً.`)
                .setColor(0x2ECC71);

            const closeRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('close_ticket').setLabel('إغلاق التذكرة').setStyle(ButtonStyle.Danger).setEmoji('🔒')
            );

            await ticketChannel.send({ content: `${member} <@&${ROLE_ADMIN}>`, embeds: [ticketEmbed], components: [closeRow] });
            await interaction.reply({ content: `✅ تم فتح تذكرتك بنجاح: ${ticketChannel}`, ephemeral: true });
        } catch (error) {
            console.error("Error creating ticket:", error);
            await interaction.reply({ content: '❌ حدث خطأ أثناء إنشاء التذكرة. تأكد من صلاحيات البوت وأيديات الفئة.', ephemeral: true });
        }
    }

    // زر طلب التفعيل
    if (interaction.customId === 'request_verification') {
        const member = interaction.member;

        if (member.roles.cache.has(ROLE_BLACKLIST)) {
            return interaction.reply({ content: '❌ عذراً، أنت في قائمة الحظر (البلاك ليست).', ephemeral: true });
        }

        try {
            if (member.roles.cache.has(ROLE_UNVERIFIED)) {
                await member.roles.remove(ROLE_UNVERIFIED);
            }

            const logChannel = interaction.guild.channels.cache.get(CHANNEL_LOG);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('📝 سجل التفعيل التلقائي')
                    .setDescription(`العضو: ${member} (${member.user.tag})\nتم إزالة رتبة غير مفعل عنه بنجاح.`)
                    .setColor(0xF1C40F)
                    .setTimestamp();
                await logChannel.send({ embeds: [logEmbed] });
            }

            await interaction.reply({ content: '✅ تم تفعيلك بنجاح ورفع رتبة غير مفعل!', ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ حدث خطأ أثناء تنفيذ التفعيل.', ephemeral: true });
        }
    }

    // زر الأسئلة والروابط التفاعلية (FAQ)
    if (interaction.customId === 'faq_info') {
        const faqEmbed = new EmbedBuilder()
            .setTitle('❓ الأسئلة الشائعة والروابط المهمة')
            .setDescription('هنا تجد أبرز التعليمات وروابط السيرفر الأساسية:')
            .addFields(
                { name: '🔹 كيف أفتح تذكرة؟', value: 'اضغط على زر "فتح تذكرة" في اللوحة الرئيسية وسيتم إنشاء روم خاص بك.' },
                { name: '🔹 كيف أفعل حسابي؟', value: 'اضغط على زر "طلب تفعيل" وسيتم إزالة رتبة غير مفعل تلقائياً.' },
                { name: '⭐ نظام النقاط:', value: 'استخدم أمر `!points` لعرض نقاطك، أو استخدم أوامر الإدارة لإضافتها وتصفيرها.' }
            )
            .setColor(0x9B59B6);

        await interaction.reply({ embeds: [faqEmbed], ephemeral: true });
    }

    // زر إغلاق التذكرة
    if (interaction.customId === 'close_ticket') {
        const channel = interaction.channel;
        await interaction.reply({ content: '🔒 جاري إغلاق التذكرة وحذفها خلال 5 ثوانٍ...' });
        setTimeout(async () => {
            try { await channel.delete(); } catch (err) { console.error(err); }
        }, 5000);
    }
});

client.login(process.env.TOKEN);
