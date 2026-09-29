const { 
    Client, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder, 
    ChannelType, 
    PermissionsBitField,
    SlashCommandBuilder,
    REST,
    Routes,
    ActivityType 
} = require('discord.js');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Abu Ghamdah System Bot is alive and running! 🚀');
});

app.listen(PORT, () => {
    console.log(`Web server is listening on port ${PORT}`);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const CONFIG = {
    roleVerified: "1546173143180247043",      
    roleUnverified: "1546173144572624926",    
    rolePlayPass: "1546173141766639718",      
    roleStaff: "1546173030617710773",         
    logChannel: "1553726188470669342",        
    categoryTickets: "1553517079636742164",   
    serverNameSuffix: " 𝐌𝐑 | "                 
};

const staffPoints = new Map(); 
const activeTickets = new Map(); 

client.once('ready', async () => {
    console.log(`تم تسجيل الدخول بنجاح باسم ${client.user.tag}! البوت جاهز.`);

    client.user.setPresence({
        activities: [{ name: 'تكتات التفعيل 🎮', type: ActivityType.Watching }],
        status: 'online',
    });

    const commands = [
        new SlashCommandBuilder()
            .setName('setup-verify')
            .setDescription('إرسال بنر فتح تذكرة التفعيل الإداري'),
        new SlashCommandBuilder()
            .setName('pointict')
            .setDescription('عرض نقاط الإداريين في تذاكر التفعيل'),
        new SlashCommandBuilder()
            .setName('restpointict')
            .setDescription('تصفير نقاط الإداريين بالكامل')
    ];

    const botToken = process.env.DISCORD_TOKEN || process.env.TOKEN;
    const rest = new REST({ version: '10' }).setToken(botToken);
    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('تم تسجيل أوامر السلاش (Slash Commands) بنجاح! 🚀');
    } catch (error) {
        console.error('خطأ في تسجيل أوامر السلاش:', error);
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const ticketData = activeTickets.get(message.channel.id);
    if (ticketData && message.author.id === ticketData.userId) {
        if (ticketData.timer) {
            clearTimeout(ticketData.timer);
            ticketData.timer = null;
            await message.channel.send("تم الغاء نظام التنبيه ⚠️");
        }

        const step = ticketData.step;

        if (step === 1) {
            ticketData.answers[1] = message.content;
            ticketData.step = 2;
            await message.channel.send(`**السؤال 2/6:** عمرك؟ (اجباري أرقام فقط)`);
        } else if (step === 2) {
            if (isNaN(message.content)) {
                return message.reply("خطأ! عيد أرسل أرقام فقط ❌");
            }
            ticketData.answers[2] = message.content;
            ticketData.step = 3;
            await message.channel.send(`**السؤال 3/6:** يوزرك روبلكس؟ (إنجليزي فقط)`);
        } else if (step === 3) {
            if (!/^[A-Za-z0-9_]+$/.test(message.content)) {
                return message.reply("خطأ! يرجى إدخال أحرف إنجليزية وأرقام فقط ❌");
            }
            ticketData.answers[3] = message.content;
            ticketData.step = 4;
            await message.channel.send(`**السؤال 4/6:** صورة بروفايلك روبلكس؟ (أرسل صورة)`);
        } else if (step === 4) {
            const attachment = message.attachments.first();
            if (!attachment) {
                return message.reply("خطأ! يجب إرسال صورة بروفايلك ❌");
            }
            ticketData.answers[4] = attachment.url;
            ticketData.step = 5;
            await message.channel.send(`**السؤال 5/6:** صورة دخولك القروب؟\nرابط قروبنا 📎 : [اضغط هنا](https://www.roblox.com/share/g/387192545)\n(أرسل صورة إثبات الدخول)`);
        } else if (step === 5) {
            const attachment = message.attachments.first();
            if (!attachment) {
                return message.reply("خطأ! يجب إرسال صورة إثبات دخول القروب ❌");
            }
            ticketData.answers[5] = attachment.url;
            ticketData.step = 6;
            
            const name1 = ticketData.answers[1];
            await message.channel.send(`**السؤال 6/6:** الحلف:\nأنا أقر (${name1}) وأقسم بالله: أنّي ما أخرب اي رول، وما أستخدم اي رتبه ل تشويه سمعة السيرفر، وما أستخدم أي صلاحية لضرر أو لمصالح شخصية\n*(يرجى كتابة الحلف بالنص تماماً مع اسمك)*`);
        } else if (step === 6) {
            const expectedHalf = `أنا أقر (${ticketData.answers[1]}) وأقسم بالله: أنّي ما أخرب اي رول، وما أستخدم اي رتبه ل تشويه سمعة السيرفر، وما أستخدم أي صلاحية لضرر أو لمصالح شخصية`;
            
            if (message.content.trim() !== expectedHalf.trim()) {
                return message.reply("خطأ! الحلف غير مطابق تماماً لما طلب منك، يرجى كتابته بالشكل الصحيح ❌");
            }

            ticketData.answers[6] = message.content;
            ticketData.step = 7;

            const reviewEmbed = new EmbedBuilder()
                .setColor(0x00FFFF)
                .setTitle("قبول ✅ أو رفض ❌ طلب التفعيل")
                .setDescription(
                    `١ الإجابة : ${ticketData.answers[1]}\n` +
                    `٢ الإجابة : ${ticketData.answers[2]}\n` +
                    `٣ الإجابة : ${ticketData.answers[3]}\n` +
                    `٤ الإجابة : [صورة](${ticketData.answers[4]})\n` +
                    `٥ الإجابة : [صورة](${ticketData.answers[5]})\n` +
                    `٦ الإجابة : ${ticketData.answers[6]}`
                );

            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('accept_ticket').setLabel('قبول الطلب ✅️').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('reject_ticket').setLabel('رفض الطلب ❌️').setStyle(ButtonStyle.Danger)
            );

            await message.channel.send({
                content: `انتهى العضو من الأسئلة التفاعلية! ينتظر قرار الإدارة:`,
                embeds: [reviewEmbed],
                components: [actionRow]
            });
        }
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const { commandName, member, channel } = interaction;

        if (commandName === 'setup-verify') {
            if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: "عذراً، هذا الأمر للأحكام الإدارية فقط! ❌", ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: true });

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle("من هنا يمكنكم العب والتفعيل معنا 💞.")
                .setDescription(
                    "فتح تذكرة ل تقديم على رتبة تصريح لعب 🎮\n\n" +
                    "يمكنك من خلالها لعب الرولات معنا 🤝🏼\n\n" +
                    "قم فقط ب الإجابة على الأسئلة التفاعليه 🤍.\n\n" +
                    "وشكرا لكم...💞"
                );

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('open_ticket')
                    .setLabel('فتح تذكرة تفعيل ✅️')
                    .setStyle(ButtonStyle.Success)
            );

            await channel.send({ embeds: [embed], components: [row] });
            return interaction.editReply({ content: "تم إرسال بنر التفعيل بنجاح! ✅" });
        }

        if (commandName === 'pointict') {
            if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: "عذراً، هذا الأمر للأحكام الإدارية فقط! ❌", ephemeral: true });
            }
            
            const sortedPoints = [...staffPoints.entries()].sort((a, b) => b[1] - a[1]);
            let desc = sortedPoints.length > 0 
                ? sortedPoints.map(([id, pts], index) => `${index + 1} <@${id}> : ${pts}`).join('\n')
                : 'لا توجد نقاط مسجلة حتى الآن.';

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle("نقاط تذكرة التفعيل")
                .setDescription(desc);

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (commandName === 'restpointict') {
            if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: "عذراً، هذا الأمر للأحكام الإدارية فقط! ❌", ephemeral: true });
            }
            staffPoints.clear();
            return interaction.reply({ content: "تم تصفير جميع نقاط الإداريين بنجاح! 🔄", ephemeral: true });
        }
    }

    if (!interaction.isButton()) return;

    const { customId, channel, guild, member, user } = interaction;

    if (customId === 'open_ticket') {
        await interaction.deferReply({ ephemeral: true });

        const ticketName = `ticket-${user.username}`;
        const ticketChannel = await guild.channels.create({
            name: ticketName,
            type: ChannelType.GuildText,
            parent: CONFIG.categoryTickets,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                },
                {
                    id: CONFIG.roleStaff,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                }
            ],
        });

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle("تم فتح تذكرة تفعيل ✅.")
            .setDescription("انت الان بـ الأسئلة التفاعلية لـ التفعيل قم بـ الإجابة عليها 💞.");

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_options').setLabel('خيارات التذكرة ⚙️').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('close_ticket').setLabel('إغلاق التذكرة ❌️').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('claim_ticket').setLabel('استلام التذكرة ✅️').setStyle(ButtonStyle.Success)
        );

        await ticketChannel.send({
            content: `<@&${CONFIG.roleStaff}> | <@${user.id}>`,
            embeds: [embed],
            components: [row]
        });

        activeTickets.set(ticketChannel.id, {
            userId: user.id,
            step: 1,
            answers: {},
            claimedBy: null,
            timer: null
        });

        await ticketChannel.send(`<@${user.id}> **السؤال 1/6:** ما هو اسمك؟`);

        return interaction.editReply({ content: `تم فتح تذكرتك بنجاح هنا: <#${ticketChannel.id}> 🎟️` });
    }

    if (customId === 'claim_ticket') {
        if (!member.roles.cache.has(CONFIG.roleStaff)) {
            return interaction.reply({ content: "هذا الزر خاص بالفريق الإداري فقط! ❌", ephemeral: true });
        }

        const ticketData = activeTickets.get(channel.id);
        if (ticketData && ticketData.claimedBy) {
            return interaction.reply({ content: `تم استلام هذه التذكرة مسبقاً من قِبل الإداري <@${ticketData.claimedBy}>! ⚠️`, ephemeral: true });
        }

        if (ticketData) ticketData.claimedBy = user.id;

        const currentPoints = staffPoints.get(user.id) || 0;
        staffPoints.set(user.id, currentPoints + 1);

        await channel.send({
            content: `🔒 **تم استلام التذكرة بنجاح!**\n👤 **الإداري المسؤول:** <@${user.id}> (أيدي: \`${user.id}\`)\n✨ تم منح الإداري نقطة واحدة (+1).\n📊 إجمالي نقاطه الحالية = **${currentPoints + 1}**`
        });

        return interaction.reply({ content: "تم استلام التذكرة بنجاح وتسجيل النقطة لك.", ephemeral: true });
    }

    if (customId === 'close_ticket') {
        if (!member.roles.cache.has(CONFIG.roleStaff)) {
            return interaction.reply({ content: "هذا الزر خاص بالفريق الإداري فقط! ❌", ephemeral: true });
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('delete_ticket_confirm').setLabel('حذف التذكرة 🗑').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('leave_ticket').setLabel('ترك التذكرة 🚫').setStyle(ButtonStyle.Secondary)
        );

        await channel.send({ content: "اختر إجراء الإغلاق:", components: [row] });
        await interaction.reply({ content: "تم إرسال خيارات الإغلاق.", ephemeral: true });
    }

    if (customId === 'leave_ticket') {
        const ticketData = activeTickets.get(channel.id);
        if (ticketData && ticketData.claimedBy === user.id) {
            ticketData.claimedBy = null;
            const currentPoints = staffPoints.get(user.id) || 1;
            staffPoints.set(user.id, Math.max(0, currentPoints - 1));

            await channel.send(`**ترك التذكرة 🚫**\nالإداري المستلم ترك التذكرة <@${user.id}>\nتم خصم نقطة واحدة منك.`);
            
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('claim_ticket').setLabel('استلام التذكرة ✅️').setStyle(ButtonStyle.Success)
            );
            await channel.send({ content: `<@&${CONFIG.roleStaff}>\nالرجاء الإستلام`, components: [row] });
        }
        return interaction.reply({ content: "تم ترك التذكرة.", ephemeral: true });
    }

    if (customId === 'delete_ticket_confirm') {
        await channel.send("حذف التذكرة 🗑\nسيتم حذف التذكرة...");
        setTimeout(() => channel.delete().catch(() => {}), 3000);
    }

    if (customId === 'ticket_options') {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('opt_warn').setLabel('تنبيه العضو ⚠️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('opt_summon').setLabel('استدعاء الاداري ☑').setStyle(ButtonStyle.Success)
        );
        return interaction.reply({ content: "خيارات التذكرة ⚙️", components: [row], ephemeral: true });
    }

    if (customId === 'opt_warn') {
        const ticketData = activeTickets.get(channel.id);
        if (!ticketData) return;

        await channel.send(`تم تفعيل وضع التنبيه ⚠️\nلـ العضو <@${ticketData.userId}>\nاذا لم يتم الرد في ٥ دقائق سيتم إغلاق التذكرة تلقائيا.`);
        
        const timer = setTimeout(async () => {
            await channel.send("انتهت المدة ولم يتم الرد، سيتم حذف التذكرة تلقائياً.");
            setTimeout(() => channel.delete().catch(() => {}), 3000);
        }, 5 * 60 * 1000);

        ticketData.timer = timer;
        return interaction.reply({ content: "تم تفعيل التنبيه.", ephemeral: true });
    }

    if (customId === 'opt_summon') {
        const ticketData = activeTickets.get(channel.id);
        if (ticketData && ticketData.claimedBy) {
            await channel.send(`استدعاء الاداري ☑️\nتم استدعاء الاداري المسؤول <@${ticketData.claimedBy}>`);
        } else {
            await channel.send(`استدعاء الاداري ☑️\n<@&${CONFIG.roleStaff}> الرجاء الرد على التذكرة!`);
        }
        return interaction.reply({ content: "تم الاستدعاء.", ephemeral: true });
    }

    if (customId === 'accept_ticket') {
        if (!member.roles.cache.has(CONFIG.roleStaff)) {
            return interaction.reply({ content: "عذراً، أزرار القبول والرفض خاصة بالفريق الإداري فقط! ❌", ephemeral: true });
        }

        const ticketData = activeTickets.get(channel.id);
        if (!ticketData) return;

        const targetMember = await guild.members.fetch(ticketData.userId).catch(() => null);
        if (targetMember) {
            await targetMember.roles.add(CONFIG.rolePlayPass);
            await targetMember.roles.remove(CONFIG.roleUnverified);
            
            const robloxUser = ticketData.answers[3] || targetMember.user.username;
            await targetNameMember.setNickname(`${CONFIG.serverNameSuffix.trim()} ${robloxUser}`).catch(() => {});
        }

        await channel.send("تم قبول الطلب ✅. سيتم إغلاق التذكرة خلال لحظات...");
        
        const logChan = guild.channels.cache.get(CONFIG.logChannel);
        if (logChan) {
            const logEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle("سجل قبول تفعيل جديد ✅")
                .setDescription(
                    `**العضو صاحب التذكرة:** <@${ticketData.userId}>\n` +
                    `**الإداري المسؤول:** <@${user.id}> (أيدي: \`${user.id}\`)\n` +
                    `**التاريخ والوقت:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
                    `١ الإجابة : ${ticketData.answers[1]}\n` +
                    `٢ الإجابة : ${ticketData.answers[2]}\n` +
                    `٣ الإجابة : ${ticketData.answers[3]}\n` +
                    `٤ الإجابة : [صورة](${ticketData.answers[4]})\n` +
                    `٥ الإجابة : [صورة](${ticketData.answers[5]})\n` +
                    `٦ الإجابة : ${ticketData.answers[6]}`
                );
            await logChan.send({ embeds: [logEmbed] });
        }

        setTimeout(() => channel.delete().catch(() => {}), 15000);
        return interaction.reply({ content: "تم قبول التفعيل بنجاح.", ephemeral: true });
    }

    if (customId === 'reject_ticket') {
        if (!member.roles.cache.has(CONFIG.roleStaff)) {
            return interaction.reply({ content: "عذراً، أزرار القبول والرفض خاصة بالفريق الإداري فقط! ❌", ephemeral: true });
        }

        const ticketData = activeTickets.get(channel.id);
        if (!ticketData) return;

        await channel.send("تم رفض الطلب ❌. سيتم إغلاق التذكرة...");

        const logChan = guild.channels.cache.get(CONFIG.logChannel);
        if (logChan) {
            const logEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle("سجل رفض تفعيل ❌")
                .setDescription(
                    `**العضو صاحب التذكرة:** <@${ticketData.userId}>\n` +
                    `**الإداري المسؤول:** <@${user.id}> (أيدي: \`${user.id}\`)\n` +
                    `**التاريخ والوقت:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
                    `١ الإجابة : ${ticketData.answers[1]}\n` +
                    `٢ الإجابة : ${ticketData.answers[2]}\n` +
                    `٣ الإجابة : ${ticketData.answers[3]}\n` +
                    `٤ الإجابة : [صورة](${ticketData.answers[4]})\n` +
                    `٥ الإجابة : [صورة](${ticketData.answers[5]})\n` +
                    `٦ الإجابة : ${ticketData.answers[6]}`
                );
            await logChan.send({ embeds: [logEmbed] });
        }

        setTimeout(() => channel.delete().catch(() => {}), 10000);
        return interaction.reply({ content: "تم رفض الطلب.", ephemeral: true });
    }
});

const finalBotToken = process.env.DISCORD_TOKEN || process.env.TOKEN;

if (!finalBotToken) {
    console.error("خطأ حرج: لم يتم العثور على توكن البوت في متغيرات البيئة (DISCORD_TOKEN أو TOKEN)!");
} else {
    client.login(finalBotToken).then(() => {
        console.log("تم إرسال أمر تسجيل الدخول للبوت بنجاح تام!");
    }).catch(err => {
        console.error("خطأ قاتل أثناء محاولة تسجيل دخول البوت من ديسكورد:", err);
    });
}
