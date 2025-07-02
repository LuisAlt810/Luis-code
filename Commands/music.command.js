require('dotenv').config();

const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');

const prefix = process.env.PREFIX || '!';
const token = process.env.TOKEN;

if (!token) {
  console.error('No token found in .env file!');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ]
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'play') {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('You need to be in a voice channel!');

    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has(PermissionsBitField.Flags.Connect) || !permissions.has(PermissionsBitField.Flags.Speak)) {
      return message.reply('I need permissions to join and speak in your voice channel!');
    }

    const url = args[0];
    if (!url || !ytdl.validateURL(url)) return message.reply('Please provide a valid YouTube URL.');

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
    });

    const stream = ytdl(url, { filter: 'audioonly' });
    const resource = createAudioResource(stream);

    const player = createAudioPlayer();
    player.play(resource);

    connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
      connection.destroy();
    });

    message.channel.send(`🎶 Playing now: ${url}`);
  }

  if (command === 'stop') {
    const connection = joinVoiceChannel.getVoiceConnection(message.guild.id);
    if (!connection) return message.reply('I am not connected to a voice channel.');

    connection.destroy();
    message.channel.send('Stopped playing and left the voice channel.');
  }
});

client.login(token);
