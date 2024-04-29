import { Client, Message, Role } from "discord.js";
import OpenAI from "openai";
import { configDotenv } from "dotenv";
configDotenv()

const client = new Client({
    intents: ["Guilds", "GuildMembers", "GuildMessages", "MessageContent"]
})

client.on('ready', () => {
    console.log("bot is online...");
})

const ignorePrefix = "!"
const channels = ['1234375993896996895']
const openai = new OpenAI({
    apiKey: process.env.OPENAIAPIKEY
})

client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return
    if (msg.content.startsWith(ignorePrefix)) return
    if (!channels.includes(msg.channelId) && !msg.mentions.users.has(client.user.id)) return


    await msg.channel.sendTyping()
    
    const sendTypingInterval = setInterval(() => {
        msg.channel.sendTyping()
    }, 5000)

    let conversation = [];
    conversation.push({
        role: "system",
        content: "Chat GPT is a friendly chat bot"
    })

    let prevMsg = await msg.channel.messages.fetch({limit: 10})
    prevMsg.reverse()

    prevMsg.forEach(msg => {
        if (msg.author.bot && msg.author.id !== client.user.id ) return
        if (msg.content.startsWith(ignorePrefix)) return

        const userName = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '')

        if (msg.author.id === client.user.id) {
            conversation.push({
                role: "assistant",
                name: userName,
                content: msg.content
            })
            return
        }

        conversation.push({
            role: "user",
            name: userName,
            content: msg.content
        })
    })

    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: conversation

    }).catch((err)=> console.error(err))

    clearInterval(sendTypingInterval)

    if (!response) {
        msg.reply("I'm having trouble sending replies at this time. try again later")
        return
    }

    const responseMsg = response.choices[0].message.content
    const chunkSizeLimit = 2000

    for (let i = 0; i < responseMsg.length; i += chunkSizeLimit) {
        const chunk = responseMsg.substring(i, i + chunkSizeLimit)
        await msg.reply(chunk)
    }


})
client.login(process.env.TOKEN)
