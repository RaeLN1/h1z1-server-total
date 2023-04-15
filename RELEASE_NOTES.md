# Modifications

* .vscode\launch.json
    * Development environment configurations
* data\2016\dataSources\weather.json
    * Gamma changes
* data\2016\encryptedData\encryptedData.json
    * Encrypted suspicious process list
* data\2016\sampleData\stats.json
    * Base speed
* data\2016\zoneData\Z1_POIs.json
    * Increased block construction range

* src\servers\ZoneServer2016\classes\zoneclient.ts
    * Third / First person sniper
* src\servers\ZoneServer2016\commands\commands.ts
    * Discord Hook Ban Channel on Ban
    * Third / First person sniper
    * Changed permissions
    * Removed "shutdown" command
    * Points to lootspawns-total
* src\servers\ZoneServer2016\data\lootspawns-total.ts
    * Lootspawn revamp
* src\servers\ZoneServer2016\entities\basefullcharacter.ts
    * Hammer durability increased
* src\servers\ZoneServer2016\entities\character.ts
    * Increased combatlog length
* src\servers\ZoneServer2016\entities\crate.ts
    * Points to lootspawns-total
* src\servers\ZoneServer2016\entities\lootableprop.ts
    * Reduced search times
* src\servers\ZoneServer2016\managers\fairplaymanager.ts
    * Decrypt keys
* src\servers\ZoneServer2016\managers\groupmanager.ts
    * Limit group size
* src\servers\ZoneServer2016\managers\worldobjectmanager.ts
    * Points to lootspawns-total
    * No zombies
* src\servers\ZoneServer2016\zonepackethandlers.ts
    * Whitelist check
    * Logout timer
* src\servers\ZoneServer2016\zoneserver.ts
    * Discord Hook Ip Channel on Disconnect
    * Third / First person sniper
    * Whitelist logic and messages
    * Removed combatlog condition to dead players
    * Hammer durability increased
    * Stack ammo dismantle
* src\utils\discord.ts
    * Webhook interface
* src\utils\utils.ts
    * Encryption and Generate Key function

* .gitignore
    * Removed config.yaml file ignore
* communityinstall.sh
    * Added install file
* config.yaml
    * Server configs
* package.json + package-lock.json
    * Installed discord-webhook-node
* RELEASE_NOTES.md
    * This file
* start.sh
    * Start server script