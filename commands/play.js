import util from "../util.js"
import { SlashCommandBuilder } from "discord.js"

const data = new SlashCommandBuilder()
.setName('play')
.setDescription('i wanna play pokemon crystal :D')

async function execute(interaction) {
    console.log('executing play command')
    await interaction.deferReply()
    const {embed, attachment} = util.createAttachmentsAndEmbed()
    const components = util.createComponents()
    await interaction.editReply({
        embeds: [
            embed
        ],
        files: [attachment],
        components
    })
}

export {data, execute};
