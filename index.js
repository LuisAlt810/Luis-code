require('dotenv').config();

const { Client, GatewayIntentBits, Partials } = require('discord.js');

const prefix = process.env.PREFIX || '!';
const token = process.env.TOKEN;

if (!token) {
  console.error("❌ No token found in .env file!");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel]
});

// Track command usage timestamps
let commandTimestamps = [];

const PRESENCE_CHECK_INTERVAL = 60 * 1000;  // 1 minute
const IDLE_TIMEOUT = 5 * 60 * 1000;         // 5 minutes
const OFFLINE_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
const DND_COMMANDS_THRESHOLD = 10;           // >10 commands in last 1 min = dnd

function updatePresence() {
  const now = Date.now();

  // Clean timestamps older than 24 hours
  commandTimestamps = commandTimestamps.filter(ts => now - ts <= OFFLINE_TIMEOUT);

  if (commandTimestamps.length === 0) {
    client.user.setPresence({ status: 'invisible' });
    console.log('Presence set to OFFLINE (invisible)');
    return;
  }

  const lastCommandTime = commandTimestamps[commandTimestamps.length - 1];
  const sinceLast = now - lastCommandTime;

  const commandsLastMinute = commandTimestamps.filter(ts => now - ts <= PRESENCE_CHECK_INTERVAL).length;

  if (sinceLast > IDLE_TIMEOUT) {
    client.user.setPresence({
      status: 'idle',
      activities: [{ name: 'Waiting for commands...', type: 3 }] // Watching
    });
    console.log('Presence set to IDLE');
  } else if (commandsLastMinute >= DND_COMMANDS_THRESHOLD) {
    client.user.setPresence({
      status: 'dnd',
      activities: [{ name: 'Handling many commands!', type: 2 }] // Listening
    });
    console.log('Presence set to DND');
  } else {
    client.user.setPresence({
      status: 'online',
      activities: [{ name: 'Ready to serve!', type: 0 }] // Playing
    });
    console.log('Presence set to ONLINE');
  }
}

setInterval(() => {
  if (client.isReady()) updatePresence();
}, PRESENCE_CHECK_INTERVAL);

client.on('messageCreate', message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  if (client.presence.status === 'invisible') return; // Ignore commands if offline

  // Log this command usage time
  commandTimestamps.push(Date.now());

  // Update presence immediately
  updatePresence();

  // No actual command processing here — add your commands separately
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(token);