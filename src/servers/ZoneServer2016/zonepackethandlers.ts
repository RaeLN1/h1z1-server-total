 
  import { ZoneClient2016 as Client } from "./classes/zoneclient";

import { ZoneServer2016} from "./zoneserver";

const debug = require("debug")("zonepacketHandlers");

import { joaat } from "h1emu-core";

let hax = require("./commands/hax").default;

let dev = require("./commands/dev").default;

import admin from "./commands/admin";

import {
  _,
  generateRandomGuid,
  Int64String,
  isPosInRadius,
} from "../../utils/utils";

const itemDefinitions = require("./../../../data/2016/dataSources/ClientItemDefinitions.json");


export class zonePacketHandlers{
ClientIsReady:any;
ClientFinishedLoading:any;
Security:any;
commandRecipeStart:any;
commandFreeInteractionNpc:any;
collisionDamage:any;
lobbyGameDefinitionDefinitionsRequest:any;
KeepAlive:any;
clientUpdateMonitorTimeDrift:any;
ClientLog:any;
wallOfDataUIEvent:any;
SetLocale:any;
GetContinentBattleInfo:any;
chatChat:any;
ClientInitializationDetails:any;
ClientLogout:any;
GameTimeSync:any;
Synchronization:any;
commandExecuteCommand:any;
commandInteractRequest:any;
commandInteractCancel:any;
commandStartLogoutRequest:any;
CharacterSelectSessionRequest:any;
profileStatsGetPlayerProfileStats:any;
Pickup:any;
GetRewardBuffInfo:any;
PlayerUpdateManagedPosition:any;
vehicleStateData:any;
PlayerUpdateUpdatePositionClientToZone:any;
characterRespawn:any;
characterFullCharacterDataRequest:any;
commandPlayerSelect:any;
mountDismountRequest:any;
commandInteractionString:any;
mountSeatChangeRequest:any;
constructionPlacementFinalizeRequest:any;
commandItemDefinitionRequest:any;
characterWeaponStance:any;
constructor(){this.ClientIsReady = function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    server.sendData(client, "ClientBeginZoning", {
      skyData: server._weather2016,
    }); // Needed for trees

    server.sendData(client, "QuickChat.SendData", { commands: [] });

    server.sendData(client, "ClientUpdate.DoneSendingPreloadCharacters", {
      done: true,
    }); // Required for WaitForWorldReady

    server.sendData(client, "ClientUpdate.NetworkProximityUpdatesComplete", {
      done: true,
    }); // Required for WaitForWorldReady

    server.sendData(client, "ZoneSetting.Data", {
      settings: [
        {
          hash: joaat("zonesetting.deploy.on.login".toUpperCase()),
          value: 1,
          settingType: 2,
          unknown1: 0,
          unknown2: 0,
        },
        {
          hash: joaat("zonesetting.no.acquisition.timers".toUpperCase()),
          value: 1,
          settingType: 2,
          unknown1: 0,
          unknown2: 0,
        },
        {
          hash: joaat("zonesetting.XpMultiplier".toUpperCase()),
          value: 1,
          settingType: 1,
          unknown1: 0,
          unknown2: 0,
        },
        {
          hash: joaat("zonesetting.disabletrialitems".toUpperCase()),
          value: 1,
          settingType: 2,
          unknown1: 0,
          unknown2: 0,
        },
        {
          hash: joaat("zonesetting.isvrzone".toUpperCase()),
          value: 0,
          settingType: 2,
          unknown1: 0,
          unknown2: 0,
        },
        {
          hash: joaat("zonesetting.no.resource.costs".toUpperCase()),
          value: 1,
          settingType: 2,
          unknown1: 0,
          unknown2: 0,
        },
      ],
    });

    server.sendData(client, "Character.CharacterStateDelta", {
      guid1: client.character.guid,
      guid2: "0x0000000000000000",
      guid3: "0x0000000040000000",
      guid4: "0x0000000000000000",
      gameTime: (server.getServerTime() & 0xffffffff) >>> 0,
    });

    // client.character.currentLoadoutId = 3;
    /*
        server.sendData(client, "Loadout.SetCurrentLoadout", {
          guid: client.character.guid,
          loadoutId: client.character.currentLoadoutId,
        });
        */

    server.sendData(client, "ZoneDoneSendingInitialData", {}); // Required for WaitForWorldReady

    const commands = [
      "hax",
      "dev",
      "admin",
      "location",
      "serverinfo",
      "spawninfo",
      "help",
    ];

    commands.forEach((command) => {
      server.sendData(client, "Command.AddWorldCommand", {
        command: command,
      });
    });

    server.sendData(client, "Synchronization", {
      serverTime: Int64String(server.getServerTime()),
      serverTime2: Int64String(server.getServerTime()),
    });

    server.sendData(client, "Command.ItemDefinitions", { // sends full list of item definitions
      data: {
        itemDefinitions: itemDefinitions.map((itemDef: any) => {
            return {
                ID: itemDef.ID,
                definitionData: {
                  ...itemDef,
                  HUD_IMAGE_SET_ID: itemDef.IMAGE_SET_ID,
                  flags1: {
                    ...itemDef,
                  },
                  flags2: {
                    ...itemDef,
                  },
                  stats: [],
                },
            }
        })
      }
    });
    
    server.sendData(client, "Character.WeaponStance", { // activates weaponstance key
        characterId: client.character.characterId,
        stance: 1
    });
  }
this.ClientFinishedLoading = function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    client.currentPOI = 0; // clears currentPOI for POIManager
    server.sendGameTimeSync(client);
    if (client.firstLoading) {
      server.sendData(client, "POIChangeMessage", {
        // welcome POI message
        messageStringId: 20,
        id: 99,
      });
      server.sendChatText(client, "Welcome to H1emu ! :D", true);
      server.sendGlobalChatText(
        `${client.character.name} has joined the server !`
      );
      client.firstLoading = false;
      client.pingTimer?.refresh();
      client.savePositionTimer = setTimeout(
        () => server.saveCharacterPosition(client),
        30000
      );
      server.executeFuncForAllClients(()=>server.spawnCharacters);
    }

    client.isLoading = false;
  }
this.Security = function (server: ZoneServer2016, client: Client, packet: any) {
    debug(packet);
  }
this.commandRecipeStart = function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    debug(packet);
    //server.sendData(client, "Command.RecipeAction", {});
  }
this.commandFreeInteractionNpc = function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    debug("FreeInteractionNpc");
    server.sendData(client, "Command.FreeInteractionNpc", {});
  }
this.collisionDamage = function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    console.log("Collision.Damage");
    console.log(packet);
  }
this.lobbyGameDefinitionDefinitionsRequest = function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    server.sendData(client, "LobbyGameDefinition.DefinitionsResponse", {
      definitionsData: { data: "" },
    });
  }
this.KeepAlive = function (server: ZoneServer2016, client: Client, packet: any) {
    server.sendData(client, "KeepAlive", {
      gameTime: packet.data.gameTime,
    });
  }
this.clientUpdateMonitorTimeDrift = function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {}
this.ClientLog = function (server: ZoneServer2016, client: Client, packet: any) {
    debug(packet);
  }
this.wallOfDataUIEvent = function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    debug("UIEvent");
  }
this.SetLocale = function (server: ZoneServer2016, client: Client, packet: any) {
    debug("Do nothing");
  }
this.GetContinentBattleInfo = function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    server.sendData(client, "ContinentBattleInfo", {
      zones: [
        {
          id: 1,
          nameId: 1,
          descriptionId: 1,
          population: [],
          regionPercent: [],
          populationBuff: [],
          populationTargetPercent: [],
          name: "Z1", // could use this field to load a specific TileInfo
          hexSize: 100,
          isProductionZone: 1,
        },
      ],
    });
  }
this.chatChat = function (server: ZoneServer2016, client: Client, packet: any) {
    const { channel, message } = packet.data;
    server.sendChat(client, message, channel);
  },
  /*
    "Loadout.SelectSlot": function (server: ZoneServer2016, client: Client, packet: any) {

      if (client.character.currentLoadout) {
        const loadout = client.character.currentLoadout,
          loadoutSlotId = packet.data.loadoutSlotId;
        client.character.currentLoadoutSlot = packet.data.loadoutSlotId;
        const loadoutSlots = loadout.loadoutSlots;
        for (let i = 0; i < loadoutSlots.length; i++) {
          if (loadoutSlots[i].loadoutSlotId == loadoutSlotId) {
            const itemLineId =
              loadoutSlots[i].loadoutSlotData.loadoutSlotItem.itemLineId;
            server
              .data("item_line_members")
              .findOne(
                { itemLineId: itemLineId, itemLineIndex: 0 },
                function (err, itemLineMember) {
                  const itemId = itemLineMember.itemId;
                  const inventoryItems = client.character.inventory.items;
                  for (let j = 0; j < inventoryItems.length; j++) {
                    if (inventoryItems[j].itemData.baseItem.itemId == itemId) {
                      client.character.currentLoadoutSlotItem =
                        inventoryItems[j].itemData;
                      break;
                    }
                  }
                }
              );
            break;
          }
        }
      }

    }
this.ClientInitializationDetails = function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    // just in case
    if (packet.data.unknownDword1) {
      debug("ClientInitializationDetails : ", packet.data.unknownDword1);
    }
  }
this.ClientLogout = function (server: ZoneServer2016, client: Client, packet: any) {
    debug("ClientLogout");
    server.saveCharacterPosition(client);
    server.deleteEntity(client.character.characterId, server._characters);
    server._gatewayServer._soeServer.deleteClient(client);
    delete server._characters[client.character.characterId];
    delete server._clients[client.sessionId];
  }
this.GameTimeSync = function (server: ZoneServer2016, client: Client, packet: any) {
    server.sendGameTimeSync(client);
  }
this.Synchronization = function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    const serverTime = Int64String(server.getServerTime());
    server.sendData(client, "Synchronization", {
      time1: packet.data.time1,
      time2: packet.data.time2,
      clientTime: packet.data.clientTime,
      serverTime: serverTime,
      serverTime2: serverTime,
      time3: packet.data.clientTime + 2,
    });
  }
this.commandExecuteCommand = async function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    const args: any[] = packet.data.arguments.toLowerCase().split(" ");

    switch (packet.data.commandHash) {
      case 2371122039: // /serverinfo
        if (args[0] === "mem") {
          const used = process.memoryUsage().heapUsed / 1024 / 1024;
          server.sendChatText(
            client,
            `Used memory ${Math.round(used * 100) / 100} MB`
          );
          break;
        } else {
          const {
            _clients: clients,
            _characters: characters,
            _npcs: npcs,
          } = server;
          const serverVersion = require("../../../package.json").version;
          server.sendChatText(client, `h1z1-server V${serverVersion}`, true);
          server.sendChatText(client, `Connected clients : ${_.size(clients)}`);
          server.sendChatText(client, `characters : ${_.size(characters)}`);
          server.sendChatText(client, `npcs : ${_.size(npcs)}`);
          break;
        }
      case 1757604914: // /spawninfo
        server.sendChatText(
          client,
          `You spawned at "${client.character.spawnLocation}"`,
          true
        );
        break;
      case joaat("HELP"):
      case 3575372649: // /help
        const haxCommandList: any = [];
        Object.keys(hax).forEach((key) => {
          haxCommandList.push(`/hax ${key}`);
        });
        const devCommandList: any = [];
        Object.keys(dev).forEach((key) => {
          devCommandList.push(`/dev ${key}`);
        });
        const commandList = ["/help", "/loc", "/spawninfo", "/serverinfo"];
        server.sendChatText(client, `Commands list:`);
        commandList
          .concat(haxCommandList, devCommandList)
          .sort((a, b) => a.localeCompare(b))
          .forEach((command) => {
            server.sendChatText(client, `${command}`);
          });
        break;
      case joaat("LOCATION"):
      case 3270589520: // /loc
        const { position, rotation } = client.character.state;
        server.sendChatText(
          client,
          `position: ${position[0]},${position[1]},${position[2]}`
        );
        server.sendChatText(
          client,
          `rotation: ${rotation[0]},${rotation[1]},${rotation[2]}`
        );
        break;
      case joaat("HAX"):
        hax[args[0]]
          ? hax[args[0]](server, client, args)
          : server.sendChatText(
              client,
              `Unknown command: /hax ${args[0]} , display all hax commands by using /hax list`
            );
        break;
      case joaat("DEV"):
      case 552078457: // dev
        dev[args[0]]
          ? dev[args[0]](server, client, args)
          : server.sendChatText(
              client,
              `Unknown command: /dev ${args[0]} , display all dev commands by using /dev list`
            );
        break;
      case joaat("ADMIN"):
      case 997464845: // admin
        admin[args[0]]
          ? admin[args[0]](server, client, args)
          : server.sendChatText(
              client,
              `Unknown command: /admin ${args[0]} , display all admin commands by using /admin list`
            );
        break;
    }
  },
  /*
    "Command.SetProfile": function (server: ZoneServer2016, client: Client, packet: any) {
      server.sendData(client, "Loadout.SetCurrentLoadout", {
        type: 2,
        unknown1: 0,
        loadoutId: 15,
        tabId: 256,
        unknown2: 1,
      });
    }
this.commandInteractRequest = function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    server.sendData(client, "Command.InteractionString", {
      guid: packet.data.guid,
      stringId: 5463,
      unknown4: 0,
    });
    server.sendData(client, "Command.InteractionList", {
      guid: packet.data.guid,
      unknownBoolean1: true,
      unknownArray1: [
        {
          unknownDword1: 11,
          unknownDword2: 0,
          unknownDword3: 5463,
          unknownDword4: 51,
          unknownDword5: 1,
          unknownDword6: 0,
          unknownDword7: 0,
        },
      ],
      unknownString1: "",
      unknownBoolean2: true,
      unknownArray2: [],
      unknownBoolean3: false,
    });
  },
  /*
    "Command.InteractionSelect": function (server: ZoneServer2016, client: Client, packet: any) {
      server.sendData(client, "Loadout.SetLoadouts", {
        type: 2,
        guid: packet.data.guid,
        unknownDword1: 1,
      });
    }
this.commandInteractCancel = function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    debug("Interaction Canceled");
  }
this.commandStartLogoutRequest = function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    const timerTime = 10000;
    server.sendData(client, "ClientUpdate.StartTimer", {
      stringId: 0,
      time: timerTime,
    });
    client.posAtLogoutStart = client.character.state.position;
    if (client.hudTimer != null) {
      clearTimeout(client.hudTimer);
    }
    client.hudTimer = setTimeout(() => {
      server.sendData(client, "ClientUpdate.CompleteLogoutProcess", {});
    }, timerTime);
  }
this.CharacterSelectSessionRequest = function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    server.sendData(client, "CharacterSelectSessionResponse", {
      status: 1,
      sessionId: client.loginSessionId,
    });
  }
this.profileStatsGetPlayerProfileStats = function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    server.sendData(
      client,
      "ProfileStats.PlayerProfileStats",
      require("../../../data/profilestats.json")
    );
  }
this.Pickup = function (server: ZoneServer2016, client: Client, packet: any) {
    debug(packet);
    const { data: packetData } = packet;
    server.sendData(client, "ClientUpdate.StartTimer", {
      stringId: 582,
      time: 100,
    });
    if (packetData.name === "SpeedTree.Blackberry") {
      server.sendData(client, "ClientUpdate.TextAlert", {
        message: "Blackberries...miss you...",
      });
    } else {
      server.sendData(client, "ClientUpdate.TextAlert", {
        message: packetData.name.replace("SpeedTree.", ""),
      });
    }
  }
this.GetRewardBuffInfo = function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    server.sendData(client, "RewardBuffInfo", {
      unknownFloat1: 1,
      unknownFloat2: 2,
      unknownFloat3: 3,
      unknownFloat4: 4,
      unknownFloat5: 5,
      unknownFloat6: 6,
      unknownFloat7: 7,
      unknownFloat8: 8,
      unknownFloat9: 9,
      unknownFloat10: 10,
      unknownFloat11: 11,
      unknownFloat12: 12,
    });
  }
this.PlayerUpdateManagedPosition = function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    const characterId = server._transientIds[packet.data.transientId],
    vehicle = server._vehicles[characterId];

    if (!characterId) return;
    //if (!server._soloMode) {
        server.sendDataToAllOthersWithSpawnedVehicle(client, characterId, "PlayerUpdatePosition", {
            transientId: packet.data.transientId,
            positionUpdate: packet.data.positionUpdate,
        });
        
    //}
    vehicle.positionUpdate = packet.data.positionUpdate;
    if (packet.data.positionUpdate.position) {
        server._vehicles[characterId].npcData.position = new Float32Array([
          packet.data.positionUpdate.position[0],
          packet.data.positionUpdate.position[1],
          packet.data.positionUpdate.position[2],
          0,
        ]);
        if (client.vehicle.mountedVehicle === characterId) {
          client.character.state.position = new Float32Array([
            packet.data.positionUpdate.position[0],
            packet.data.positionUpdate.position[1],
            packet.data.positionUpdate.position[2],
            0,
          ]);
          if (
            !client.posAtLastRoutine ||
            !isPosInRadius(
              server._npcRenderDistance / 2.5,
              client.character.state.position,
              client.posAtLastRoutine
            )
          ) {
            server.executeFuncForAllClients(()=>server.vehicleManager);
          }
        }
    }
  }
this.vehicleStateData = unction (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    server.sendDataToAllOthersWithSpawnedVehicle(client, packet.data.guid, "Vehicle.StateData", {
        ...packet.data
    })
  }
this.PlayerUpdateUpdatePositionClientToZone = function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    if (packet.data.flags === 510) {
      client.vehicle.falling = packet.data.unknown10_float;
    }
    const movingCharacter = server._characters[client.character.characterId];
    if (movingCharacter /*&& !server._soloMode*/) {
      if (client.vehicle.mountedVehicle) {
        const vehicle = server._vehicles[client.vehicle.mountedVehicle];
        server.sendRawToAllOthersWithSpawnedCharacter(
            client,
            movingCharacter.characterId,
            server._protocol.createPositionBroadcast2016(
                packet.data.raw,
                vehicle.npcData.transientId
            )
        );
      } else {
        server.sendRawToAllOthersWithSpawnedCharacter(
            client,
            movingCharacter.characterId,
            server._protocol.createPositionBroadcast2016(
                packet.data.raw,
                movingCharacter.transientId
            )
        );
      }
    }
    if (packet.data.position) {
      // TODO: modify array element beside re-creating it
      client.character.state.position = new Float32Array([
        packet.data.position[0],
        packet.data.position[1],
        packet.data.position[2],
        0,
      ]);
      if (packet.data.unknown11_float > 6) {
        client.character.isRunning = true;
      } else {
        client.character.isRunning = false;
      }

      if (
        client.hudTimer != null &&
        !isPosInRadius(
          1,
          client.character.state.position,
          client.posAtLogoutStart
        )
      ) {
        clearTimeout(client.hudTimer);
        client.hudTimer = null;
        client.isInteracting = false;
        server.sendData(client, "ClientUpdate.StartTimer", {
          stringId: 0,
          time: 0,
        }); // don't know how it was done so
      }
    } else if (packet.data.vehicle_position && client.vehicle.mountedVehicle) {
      server._vehicles[client.vehicle.mountedVehicle].npcData.position =
        new Float32Array([
          packet.data.vehicle_position[0],
          packet.data.vehicle_position[1],
          packet.data.vehicle_position[2],
          0,
        ]);
    }
    if (packet.data.rotation) {
      // TODO: modify array element beside re-creating it
      client.character.state.rotation = new Float32Array([
        packet.data.rotation[0],
        packet.data.rotation[1],
        packet.data.rotation[2],
        packet.data.rotation[3],
      ]);

      client.character.state.lookAt = new Float32Array([
        packet.data.lookAt[0],
        packet.data.lookAt[1],
        packet.data.lookAt[2],
        packet.data.lookAt[3],
      ]);
    }
  }
this.characterRespawn = function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    debug(packet);
    server.sendData(client, "Character.RespawnReply", {
      characterId: client.character.characterId,
      position: [0, 200, 0, 1],
    });
  }
this.characterFullCharacterDataRequest = function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    const { characterId } = packet.data,
    entityData: any = 
        server._npcs[characterId] || 
        server._vehicles[characterId] || 
        server._characters[characterId] ||
        0,
    entityType = 
        server._npcs[characterId]?1:0 || 
        server._vehicles[characterId]?2:0 || 
        server._characters[characterId]?3:0;
    
    if(!entityType) return;
    switch(entityType) {
        case 1: // npcs
            server.sendData(client, "LightweightToFullNpc", {
                transientId: entityData.transientId,
                attachmentData: [
                {
                    modelName: "SurvivorMale_Chest_Hoodie_Up_Tintable.adr",
                    effectId: 0,
                    slotId: 3,
                },
                ],
                effectTags: [],
                unknownData1: {},
                targetData: {},
                unknownArray1: [],
                unknownArray2: [],
            });
            break;
        case 2: // vehicles
            server.sendData(client, "LightweightToFullVehicle", {
                npcData: {
                transientId: entityData.npcData.transientId,
                attachmentData: [],
                effectTags: [],
                unknownData1: {},
                targetData: {},
                unknownArray1: [],
                unknownArray2: [],
                },
                unknownArray1: [],
                unknownArray2: [],
                unknownArray3: [],
                unknownArray4: [],
                unknownArray5: [
                {
                    unknownData1: {
                    unknownData1: {},
                    },
                },
                ],
                unknownArray6: [],
                unknownArray7: [],
                unknownArray8: [
                {
                    unknownArray1: [],
                },
                ],
            });
            break;
        case 3: // characters
            server.sendData(client, "LightweightToFullPc", {
                positionUpdate: server.createPositionUpdate(
                entityData.state.position,
                entityData.state.rotation
                ),
                stats: [],
                fullPcData: {
                    transientId: entityData.transientId,
                    attachmentData: [],
                    unknownData1: {},
                    effectTags: [],
                },
            });
            server.updateEquipment(client, entityData);
            server.sendData(client, "Character.WeaponStance", { // activates weaponstance key
                characterId: entityData.characterId,
                stance: 1
            });
            break;
        default:
            break;
    }
  }
this.commandPlayerSelect = function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    const { guid } = packet.data,
    entityData: any = server._objects[guid] || server._vehicles[guid] || server._doors[guid] || 0,
    entityType = server._objects[guid]?1:0 || server._vehicles[guid]?2:0 || server._doors[guid]?3:0;

    if(!entityData || !isPosInRadius(
        server._interactionDistance,
        client.character.state.position,
        entityData.npcData?entityData.npcData.position:entityData.position
    )) return;

    switch (entityType) {
        case 1: // object
            const itemGuid = server.generatePickupItem(entityData),
            item = server._items[itemGuid];
            if (!item) {
                server.sendChatText(
                client,
                `[ERROR] No item definition mapped to id: ${entityData.modelId}`
                );
                return;
            }

            server.equipItem(client, itemGuid);
            server.deleteEntity(guid, server._objects);
            break;
        case 2: // vehicle
            !client.vehicle.mountedVehicle?server.mountVehicle(client, packet):server.dismountVehicle(client);
            break;
        case 3: // door
            server.sendChatText(
                client,
                `Tell @Meme#2744 to add door opening/closing ;)`
            );
            break;
        default:
            break;
    }
  }
this.mountDismountRequest = function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    // only for driver seat
    server.dismountVehicle(client);
  }
this.commandInteractionString = function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    const { guid } = packet.data,
    entityData: any = server._objects[guid] || server._vehicles[guid] || server._doors[guid] || 0,
    entityType = server._objects[guid]?1:0 || server._vehicles[guid]?2:0 || server._doors[guid]?3:0;

    if(!entityData || !isPosInRadius(
        server._interactionDistance,
        client.character.state.position,
        entityData.npcData?entityData.npcData.position:entityData.position
    )) return;

    switch (entityType) {
        case 1: // object
            server.sendData(client, "Command.InteractionString", {
                guid: guid,
                stringId: 29,
            });
            break;
        case 2: // vehicle
            if(!client.vehicle.mountedVehicle){
                server.sendData(client, "Command.InteractionString", {
                    guid: guid,
                    stringId: 15,
                })
            }
            break;
        case 3: // door
            server.sendData(client, "Command.InteractionString", {
                guid: guid,
                stringId: 31,
            });
            break;
        default:
            break;
    }
  }
this.mountSeatChangeRequest = function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    server.changeSeat(client, packet);
  }
this.constructionPlacementFinalizeRequest = function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    server.sendData(client, "Construction.PlacementFinalizeResponse", {
      status: 1,
      unknownString1: "",
    });
  }
this.commandItemDefinitionRequest = function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    console.log(`ItemDefinitionRequest ID: ${packet.data.ID}`);

    const itemDef = itemDefinitions.find(
      (itemDef: any) => itemDef.ID === packet.data.ID
    );

    server.sendData(client, "Command.ItemDefinitionReply", {
      data: {
        ID: packet.data.ID,
        definitionData: {
          ...itemDef,
          HUD_IMAGE_SET_ID: itemDef.IMAGE_SET_ID,
          flags1: {
            ...itemDef,
          },
          flags2: {
            ...itemDef,
          },
          stats: [],
        },
      },
    });
  }
this.characterWeaponStance = function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    server.sendDataToAllOthersWithSpawnedCharacter(client, "Character.WeaponStance", {
        characterId: client.character.characterId
}processPacket(server:ZoneServer,client:Client,packet:any){

    switch(packet.name){
case "ClientIsReady":
this.ClientIsReady(server,client,packet);
break
case "ClientFinishedLoading":
this.ClientFinishedLoading(server,client,packet);
break
case "Security":
this.Security(server,client,packet);
break
case "Command.RecipeStart":
this.commandRecipeStart(server,client,packet);
break
case "Command.FreeInteractionNpc":
this.commandFreeInteractionNpc(server,client,packet);
break
case "Collision.Damage":
this.collisionDamage(server,client,packet);
break
case "LobbyGameDefinition.DefinitionsRequest":
this.lobbyGameDefinitionDefinitionsRequest(server,client,packet);
break
case "KeepAlive":
this.KeepAlive(server,client,packet);
break
case "ClientUpdate.MonitorTimeDrift":
this.clientUpdateMonitorTimeDrift(server,client,packet);
break
case "ClientLog":
this.ClientLog(server,client,packet);
break
case "WallOfData.UIEvent":
this.wallOfDataUIEvent(server,client,packet);
break
case "SetLocale":
this.SetLocale(server,client,packet);
break
case "GetContinentBattleInfo":
this.GetContinentBattleInfo(server,client,packet);
break
case "Chat.Chat":
this.chatChat(server,client,packet);
break
case "ClientInitializationDetails":
this.ClientInitializationDetails(server,client,packet);
break
case "ClientLogout":
this.ClientLogout(server,client,packet);
break
case "GameTimeSync":
this.GameTimeSync(server,client,packet);
break
case "Synchronization":
this.Synchronization(server,client,packet);
break
case "Command.ExecuteCommand":
this.commandExecuteCommand(server,client,packet);
break
case "Command.InteractRequest":
this.commandInteractRequest(server,client,packet);
break
case "Command.InteractCancel":
this.commandInteractCancel(server,client,packet);
break
case "Command.StartLogoutRequest":
this.commandStartLogoutRequest(server,client,packet);
break
case "CharacterSelectSessionRequest":
this.CharacterSelectSessionRequest(server,client,packet);
break
case "ProfileStats.GetPlayerProfileStats":
this.profileStatsGetPlayerProfileStats(server,client,packet);
break
case "Pickup":
this.Pickup(server,client,packet);
break
case "GetRewardBuffInfo":
this.GetRewardBuffInfo(server,client,packet);
break
case "PlayerUpdateManagedPosition":
this.PlayerUpdateManagedPosition(server,client,packet);
break
case "Vehicle.StateData":
this.vehicleStateData(server,client,packet);
break
case "PlayerUpdateUpdatePositionClientToZone":
this.PlayerUpdateUpdatePositionClientToZone(server,client,packet);
break
case "Character.Respawn":
this.characterRespawn(server,client,packet);
break
case "Character.FullCharacterDataRequest":
this.characterFullCharacterDataRequest(server,client,packet);
break
case "Command.PlayerSelect":
this.commandPlayerSelect(server,client,packet);
break
case "Mount.DismountRequest":
this.mountDismountRequest(server,client,packet);
break
case "Command.InteractionString":
this.commandInteractionString(server,client,packet);
break
case "Mount.SeatChangeRequest":
this.mountSeatChangeRequest(server,client,packet);
break
case "Construction.PlacementFinalizeRequest":
this.constructionPlacementFinalizeRequest(server,client,packet);
break
case "Command.ItemDefinitionRequest":
this.commandItemDefinitionRequest(server,client,packet);
break
case "Character.WeaponStance":
this.characterWeaponStance(server,client,packet);
break
default:debug(packet);debug('Packet not implemented in packetHandlers');break;}}async reloadCommandCache(){
    delete require.cache[require.resolve("./commands/hax")];
    delete require.cache[require.resolve("./commands/dev")];
    hax = require("./commands/hax").default;
    dev = require("./commands/dev").default;
  }}