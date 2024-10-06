import dotenv from "dotenv"
dotenv.config()
import { Client, Events, Collection, REST, Routes } from "discord.js"
import game from "./game.js"
import util from "./util.js"
import path from "node:path"
import fs from "fs"

const token = process.env.botToken

// create the client lol
const client = new Client({ intents: [] });


client.on(Events.InteractionCreate, async(interaction) => {
    if (interaction.isMessageComponent()) {
        try {
            await interaction.deferUpdate()

            util.updateInteraction(interaction)
        } catch (err) {
            console.error(err)
        }
    } else if (interaction.isChatInputCommand()) {
        console.log(interaction.command)
        const command = interaction.client.commands.get(interaction.commandName);
    
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }
    
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    }
})

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// login xd
client.login(token);

(async function(){
    client.commands = new Collection();
    const commands = []
    const commandPath = path.join(path.resolve(), 'commands');

    const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandPath, file);
		const command = await import("file://" + filePath)
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}

    const rest = new REST().setToken(process.env.botToken);

    try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationCommands(process.env.botId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();
