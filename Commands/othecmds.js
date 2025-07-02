require('dotenv').config();

const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

const token = process.env.TOKEN;
const prefix = process.env.PREFIX || '!';

if (!token) {
  console.error('❌ No TOKEN found in .env file!');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
});

const generalCommands = {
  ping: {
    description: 'Returns bot latency',
    execute: async (message) => {
      const sent = await message.channel.send('Pinging...');
      sent.edit(`Pong! Latency is ${sent.createdTimestamp - message.createdTimestamp}ms.`);
    }
  },

  userinfo: {
    description: 'Shows info about a user',
    execute: async (message, args) => {
      const user = message.mentions.users.first() || message.author;
      message.channel.send(`User info:\n- Username: ${user.tag}\n- ID: ${user.id}`);
    }
  },

  serverinfo: {
    description: 'Shows info about the server',
    execute: async (message) => {
      const { guild } = message;
      message.channel.send(`Server info:\n- Name: ${guild.name}\n- ID: ${guild.id}\n- Members: ${guild.memberCount}`);
    }
  },

  avatar: {
    description: 'Shows avatar of a user',
    execute: async (message, args) => {
      const user = message.mentions.users.first() || message.author;
      message.channel.send(`${user.tag}'s avatar: ${user.displayAvatarURL({ dynamic: true, size: 512 })}`);
    }
  },

  help: {
    description: 'Lists available commands',
    execute: async (message) => {
      const helpMessage = `
**General Commands:**
- ping: Check bot latency
- userinfo [@user]: Get user info
- serverinfo: Get server info
- avatar [@user]: Show user avatar
- hello: Greet the bot
- help: Show this message

**Moderation Commands:**
- kick @user [reason]: Kick a member
- ban @user [reason]: Ban a member
      `;
      message.channel.send(helpMessage);
    }
  },

  hello: {
    description: 'Greets the user',
    execute: async (message) => {
      message.channel.send(`Hello ${message.author.username}. How are you?`);
    }
  },
};

const modCommands = {
  kick: {
    description: 'Kick a user',
    execute: async (message, args) => {
      if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
        return message.reply("You don't have permission to kick members.");
      }

      const member = message.mentions.members.first();
      if (!member) return message.reply('Please mention a member to kick.');

      if (!member.kickable) return message.reply('I cannot kick this user.');

      const reason = args.slice(1).join(' ') || 'No reason provided';

      await member.kick(reason);
      message.channel.send(`${member.user.tag} was kicked. Reason: ${reason}`);
    }
  },

  ban: {
    description: 'Ban a user',
    execute: async (message, args) => {
      if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return message.reply("You don't have permission to ban members.");
      }

      const member = message.mentions.members.first();
      if (!member) return message.reply('Please mention a member to ban.');

      if (!member.bannable) return message.reply('I cannot ban this user.');

      const reason = args.slice(1).join(' ') || 'No reason provided';

      await member.ban({ reason });
      message.channel.send(`${member.user.tag} was banned. Reason: ${reason}`);
    }
  }
};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (generalCommands[command]) {
    generalCommands[command].execute(message, args);
  } else if (modCommands[command]) {
    modCommands[command].execute(message, args);
  }
});

client.login(token);
