import { EmbedBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js"
import game from "./game.js"

function createAttachmentsAndEmbed() {
    let frame = game.getFrame()
    const attachment = new AttachmentBuilder()
    .setName('frame.png')
    .setFile(frame)
    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('Applemon Crystal')
        .setImage('attachment://frame.png')
        .setTimestamp()
    return { embed, attachment }
}

//remember emoji stuff is like <:arrow_down:69420>
function createComponents() {
    const left = new ButtonBuilder()
    .setCustomId('LEFT')
    .setEmoji('⬅️')
    .setStyle(ButtonStyle.Primary);
 
    const up = new ButtonBuilder()
    .setCustomId('UP')
    .setEmoji('⬆️')
    .setStyle(ButtonStyle.Primary);

    const down = new ButtonBuilder()
    .setCustomId('DOWN')
    .setEmoji('⬇️')
    .setStyle(ButtonStyle.Primary);

    const right = new ButtonBuilder()
    .setCustomId('RIGHT')
    .setEmoji('➡️')
    .setStyle(ButtonStyle.Primary);

    const a = new ButtonBuilder()
    .setCustomId('A')
    .setEmoji('🇦')
    .setStyle(ButtonStyle.Primary);

    const b = new ButtonBuilder()
    .setCustomId('B')
    .setEmoji('🇧')
    .setStyle(ButtonStyle.Primary);

    const start = new ButtonBuilder()
    .setCustomId('START')
    .setLabel('START')
    .setStyle(ButtonStyle.Secondary);

    const select = new ButtonBuilder()
    .setCustomId('SELECT')
    .setLabel('SELECT')
    .setStyle(ButtonStyle.Secondary);

    const wait = new ButtonBuilder()
    .setCustomId('wait')
    .setEmoji('🔄')
    .setStyle(ButtonStyle.Secondary);

    const deleter = new ButtonBuilder()
    .setCustomId('delete')
    .setEmoji('🇽')
    .setStyle(ButtonStyle.Danger);

    const top_row = new ActionRowBuilder()
    .addComponents(left, up, down, right);

    const bottom_row = new ActionRowBuilder()
    .addComponents(a, b, start, select, wait, deleter);

    return [top_row, bottom_row]
}

async function updateInteraction(interaction) {
    if (interaction.isMessageComponent()) {
        //the user who used the command initially is the only one who can use the delete button
        if (interaction.customId == "delete") {
            if (interaction.message.interactionMetadata.user.id == interaction.user.id) {
                return await interaction.message.delete()
            } else {
                return await interaction.followUp({ephemeral: true, content: "Only the person who used the command can use this!"})
            }

        }

        if (interaction.customId == interaction.customId.toUpperCase()) {
            game.input(interaction.customId)
        }
        game.advanceFrames(120)
    }
    const {embed, attachment} = createAttachmentsAndEmbed()
    const components = createComponents()
    await interaction.editReply({
        embeds: [
            embed
        ],
        files: [attachment],
        components
    })
}

export default { createAttachmentsAndEmbed, createComponents, updateInteraction }