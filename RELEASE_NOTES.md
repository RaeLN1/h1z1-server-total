# Modifications
* package.json + package-lock.json
    * Installed discord-webhook-node
* RELEASE_NOTES.md
    * This file
* start.sh
    * Start server script
* launch.json
    * Development environment configurations
* encryptedData.json
    * Encrypted suspicious process list
* zonepackethandlers.ts
    * Whitelist check
    * Translations
    * Logout timer
* zoneserver.ts
    * Max Ping
    * Custom decrypt key
    * Save time interval
    * Translations
    * Discord Hook Ip Channel on Disconnect
    * Whitelist logic and messages
    * Kill feed
    * Hammer durability increased
    * Stack ammo dismantle
    * Removed combatlog condition to dead players
* commands.ts
    * Translations
    * Discord Hook Ban Channel on Ban
    * Removed "shutdown" command
    * Changed permissions
* lootspawns.ts
    * Custom lootspawn values
    * GROUND_TILLER added on ItemSpawnerFarm.adr
    * WEAPON_AK47 added on ItemSpawner_Z1_MilitaryBase_Tents2.adr
    * SUGAR added on Cabinets
* basefullcharacter.ts
    * Hammer durability increased
* decaymanager.ts
    * Construction decay reduced
* discord.ts
    * Webhook interface
* utils.ts
    * Encryption and decryption changes
* character.ts
    * Increased render distance
    * Increased combatlog length
    * Translations
* plant.ts
    * Translations
* taskprop.ts
    * Translations
* vehicle.ts
    * Increased render distance
* lootableprops.ts
    * Reduced search times

-----

Verificar com o Kentin quais novos programas ele adicionou ao encryptedData.json
Verificar como funciona o _fairPlayDecryptKey
Verificar whitelist h1emu no zoneserver.ts "case "CharacterAllowedRequest": {"

----

Testar discord webhook
Testar whitelist
Testar encryptedProcessList
Testar drop dos itens