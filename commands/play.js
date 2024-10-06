import util from "../util.js"
import { SlashCommandBuilder, ApplicationIntegrationType, InteractionContextType } from "discord.js"

const data = new SlashCommandBuilder()
.setName('play')
.setDescription('i wanna play pokemon crystal :D')
.setIntegrationTypes([
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall
])
.setContexts([
    InteractionContextType.BotDM,
    InteractionContextType.Guild,
    InteractionContextType.PrivateChannel
])

async function execute(interaction) {
    console.log('executing play command')
    await interaction.deferReply()
    await util.updateInteraction(interaction)
}

export {data, execute};
