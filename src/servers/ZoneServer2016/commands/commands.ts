// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2023 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from "node:fs";
import { ClientBan, ClientMute, DamageInfo } from "types/zoneserver";

import {
  zoneShutdown,
  _,
  getDifference,
  isPosInRadius,
  toHex,
  randomIntFromInterval,
} from "../../../utils/utils";
import { ExplosiveEntity } from "../entities/explosiveentity";
import { Npc } from "../entities/npc";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import {
  characterBuildKitLoadout,
  characterKitLoadout,
} from "../data/loadouts";
import { EquipSlots, Items, ResourceIds, ResourceTypes } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { Command, PermissionLevels } from "./types";
import { ConstructionPermissions } from "types/zoneserver";
import { ConstructionParentEntity } from "../entities/constructionparententity";
import { LoadoutItem } from "../classes/loadoutItem";
import { LoadoutContainer } from "../classes/loadoutcontainer";
import { BaseItem } from "../classes/baseItem";
import { DB_COLLECTIONS } from "../../../utils/enums";
import { WorldDataManager } from "../managers/worlddatamanager";
import { DiscordHook } from "../../../utils/discord";
const itemDefinitions = require("./../../../../data/2016/dataSources/ServerItemDefinitions.json");

export const commands: Array<Command> = [
  //#region DEFAULT PERMISSIONS
  {
    name: "sniper1p",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: async (server: ZoneServer2016, client: Client, args: Array<string>) => {
      client.forceFpScope = true;
      await server._db.collection(DB_COLLECTIONS.CHARACTERS).updateOne({ characterId: client.character.characterId }, {
        $set: { forceFpScope: client.forceFpScope }
      });

      server.sendChatText(client, `Modo SNIPER PRIMEIRA PESSOA ativado com sucesso`);
      server.sendWeaponDefinitions(client);
    },
  },
  {
    name: "sniper3p",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: async (server: ZoneServer2016, client: Client, args: Array<string>) => {
      client.forceFpScope = false;
      await server._db.collection(DB_COLLECTIONS.CHARACTERS).updateOne({ characterId: client.character.characterId }, {
        $set: { forceFpScope: client.forceFpScope }
      });
      
      server.sendChatText(client, `Modo SNIPER TERCEIRA PESSOA ativado com sucesso`);
      server.sendWeaponDefinitions(client);
    },
  },
  {
    name: "me",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendChatText(client, `ZoneClientId :${client.loginSessionId}`);
    },
  },
  {
    name: "respawn",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.respawnPlayer(
        client,
        server._spawnGrid[randomIntFromInterval(0, 99)]
      );
    },
  },
  {
    name: "clientinfo",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendChatText(
        client,
        `Spawned entities count : ${client.spawnedEntities.length}`
      );
    },
  },
  {
    name: "serverinfo",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (args[0] === "mem") {
        const used = process.memoryUsage().rss / 1024 / 1024;
        server.sendChatText(
          client,
          `Memória utilizada ${Math.round(used * 100) / 100} MB.`
        );
      } else {
        const {
          _clients: clients,
          _npcs: npcs,
          _spawnedItems: objects,
          _vehicles: vehicles,
        } = server;
        const serverVersion = require("../../../../package.json").version;
        server.sendChatText(client, `h1z1-server V${serverVersion}`, true);
        const uptimeMin = (Date.now() - server._startTime) / 60000;
        server.sendChatText(
          client,
          `Uptime: ${
            uptimeMin < 60
              ? `${uptimeMin.toFixed()}m`
              : `${(uptimeMin / 60).toFixed()}h `
          }`
        );
        server.sendChatText(
          client,
          `clients : ${_.size(clients)} | npcs : ${_.size(npcs)}`
        );
        server.sendChatText(
          client,
          `items : ${_.size(objects)} | vehicles : ${_.size(vehicles)}`
        );
      }
    },
  },
  {
    name: "spawninfo",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendChatText(
        client,
        `Você spawnou em "${client.character.spawnLocation}".`,
        true
      );
    },
  },
  {
    name: "netstats",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      const soeClient = server.getSoeClient(client.soeClientId);
      if (soeClient) {
        const stats = soeClient.getNetworkStats();
        for (let index = 0; index < stats.length; index++) {
          const stat = stats[index];
          server.sendChatText(client, stat, index == 0);
        }
      }
    },
  },
  {
    name: "location",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      const { position, rotation } = client.character.state;
      server.sendChatText(
        client,
        `Posição: ${position[0].toFixed(2)},${position[1].toFixed(
          2
        )},${position[2].toFixed(2)}..`
      );
      server.sendChatText(
        client,
        `Rotação: ${rotation[0].toFixed(2)},${rotation[1].toFixed(
          2
        )},${rotation[2].toFixed(2)}..`
      );
    },
  },
  {
    name: "combatlog",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.combatLog(client);
    },
  },
  {
    name: "hood",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      const equipment = client.character._equipment[3] || {},
        equipmentModel = equipment.modelName || "";

      if (
        !client.character._equipment[3] ||
        !client.character._equipment[3].modelName.includes("Hoodie")
      ) {
        server.sendChatText(client, "[ERRO] Você não está vestindo um casaco...");
      } else {
        equipmentModel.includes("Up")
          ? (client.character._equipment[3].modelName = equipmentModel.replace(
              "Up",
              "Down"
            ))
          : (client.character._equipment[3].modelName = equipmentModel.replace(
              "Down",
              "Up"
            ));
        client.character.updateEquipmentSlot(server, EquipSlots.CHEST);
      }
    },
  },
  //#endregion

  //#region MODERATOR PERMISSIONS
  {
    name: "vanish",
    permissionLevel: PermissionLevels.MODERATOR,
    execute: async (server: ZoneServer2016, client: Client) => {
      client.character.isSpectator = !client.character.isSpectator;
      server.sendAlert(
        client,
        `Alterou spectate/vanish para ${client.character.isSpectator}`
      );
      if (!client.character.isSpectator) {
        for (const a in server._decoys) {
          const decoy = server._decoys[a];
          if (decoy.transientId == client.character.transientId) {
            server.sendDataToAll("Character.RemovePlayer", {
              characterId: decoy.characterId,
            });
            server.sendChatText(client, `Decoy removed`, false);
            client.isDecoy = false;
          }
        }
        return;
      }
      for (const a in server._clients) {
        const iteratedClient = server._clients[a];
        if (iteratedClient.spawnedEntities.includes(client.character)) {
          server.sendData(iteratedClient, "Character.RemovePlayer", {
            characterId: client.character.characterId,
          });
          iteratedClient.spawnedEntities.splice(
            iteratedClient.spawnedEntities.indexOf(client.character),
            1
          );
        }
      }
      const charData = WorldDataManager.convertCharactersToSaveData([client.character], server._worldId);
      await server.worldDataManager.saveCharacterData(charData[0]);
      server.sendData(client, "Spectator.Enable", {});
      server.sendCharacterData(client);
    },
  },
  {
    name: "getnetstats",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          `[ERRO] Uso: /getnetstats {Nome ou Id do jogador}"`,
          true
        );
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[0].toString()
      );
      if (server.playerNotFound(client, args[0].toString(), targetClient)) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
        server.sendChatText(client, "Jogador não encontrado.");
        return;
      }
      const soeClient = server.getSoeClient(targetClient.soeClientId);
      if (soeClient) {
        const stats = soeClient.getNetworkStats();
        server.sendChatText(
          client,
          `Mostrando estatistícas de conexão do jogador ${targetClient.character.name}..`,
          true
        );
        for (let index = 0; index < stats.length; index++) {
          const stat = stats[index];
          server.sendChatText(client, stat);
        }
      }
    },
  },
  {
    name: "d",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      client.properlyLogout = true;
      server.sendData(client, "CharacterSelectSessionResponse", {
        status: 1,
        sessionId: client.loginSessionId,
      });
    },
  },
  {
    name: "tp",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      let locationPosition;
      switch (args[0]) {
        case "farm":
          locationPosition = new Float32Array([-696.48, 13.86, -1847.15, 1]);
          break;
        case "zimms":
          locationPosition = new Float32Array([2209.17, 47.42, -1011.48, 1]);
          break;
        case "pv":
          locationPosition = new Float32Array([-125.55, 23.41, -1131.71, 1]);
          break;
        case "br":
          locationPosition = new Float32Array([3824.41, 168.19, -4000.0, 1]);
          break;
        case "ranchito":
          locationPosition = new Float32Array([2185.32, 42.36, 2130.49, 1]);
          break;
        case "drylake":
          locationPosition = new Float32Array([479.46, 109.7, 2902.51, 1]);
          break;
        case "dam":
          locationPosition = new Float32Array([-629.49, 69.96, 1233.49, 1]);
          break;
        case "cranberry":
          locationPosition = new Float32Array([-1368.37, 71.29, 1837.61, 1]);
          break;
        case "church":
          locationPosition = new Float32Array([-1928.68, 62.77, 2880.1, 1]);
          break;
        case "desoto":
          locationPosition = new Float32Array([-2793.22, 140.77, 1035.8, 1]);
          break;
        case "toxic":
          locationPosition = new Float32Array([-3064.68, 42.98, -2160.06, 1]);
          break;
        case "radiotower":
          locationPosition = new Float32Array([-1499.21, 353.98, -840.52, 1]);
          break;
        case "villas":
          locationPosition = new Float32Array([489.02, 102, 2942.65, 1]);
          break;
        case "military":
          locationPosition = new Float32Array([696.53, 48.08, -2470.62, 1]);
          break;
        case "hospital":
          locationPosition = new Float32Array([1895.4, 93.69, -2914.39, 1]);
          break;
        default:
          if (args.length < 3) {
            server.sendChatText(
              client,
              "Local desconhecido, para teleportar para um local específico, informe as coordenadas: x, y, z.",
              false
            );
            server.sendChatText(
              client,
              "Locais disponíveis: farm, zimms, pv, br, ranchito, drylake, dam, cranberry, church, desoto, toxic, radiotower, villas, military, hospital.",
              false
            );
            return;
          }
          locationPosition = new Float32Array([
            Number(args[0]),
            Number(args[1]),
            Number(args[2]),
            1,
          ]);
          break;
      }

      client.character.state.position = locationPosition;
      client.managedObjects?.forEach((characterId: any) => {
        server.dropVehicleManager(client, characterId);
      });
      client.isLoading = true;
      client.characterReleased = false;
      client.character.lastLoginDate = toHex(Date.now());
      server.sendData(client, "ClientUpdate.UpdateLocation", {
        position: locationPosition,
        triggerLoadingScreen: true,
      });
      server.sendWeatherUpdatePacket(client, server.weather);
    },
  },
  {
    name: "tphere",
    permissionLevel: PermissionLevels.MODERATOR,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0]) {
        server.sendChatText(client, `Uso correto: /tphere {Nome ou Id do jogador}`);
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[0].toString()
      );
      if (server.playerNotFound(client, args[0].toString(), targetClient)) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
        server.sendChatText(client, "Client not found.");
        return;
      }
      targetClient.character.state.position = client.character.state.position;
      targetClient.managedObjects?.forEach((characterId: any) => {
        server.dropVehicleManager(client, characterId);
      });
      targetClient.isLoading = true;
      targetClient.characterReleased = false;
      targetClient.character.lastLoginDate = toHex(Date.now());
      server.sendData(targetClient, "ClientUpdate.UpdateLocation", {
        position: client.character.state.position,
        triggerLoadingScreen: true,
      });
      server.sendChatText(
        client,
        `Teleportando ${targetClient.character.name} para a sua localização..`
      );
      server.sendWeatherUpdatePacket(client, server.weather);
    },
  },
  {
    name: "tpto",
    permissionLevel: PermissionLevels.MODERATOR,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0]) {
        server.sendChatText(client, `Uso correto: /tpto {Nome ou Id do jogador}`);
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[0].toString()
      );
      if (server.playerNotFound(client, args[0].toString(), targetClient)) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
        server.sendChatText(client, "Jogador não encontrado.");
        return;
      }
      client.character.state.position = targetClient.character.state.position;
      client.managedObjects?.forEach((characterId: any) => {
        server.dropVehicleManager(client, characterId);
      });
      client.isLoading = true;
      client.characterReleased = false;
      client.character.lastLoginDate = toHex(Date.now());
      server.sendData(client, "ClientUpdate.UpdateLocation", {
        position: targetClient.character.state.position,
        triggerLoadingScreen: true,
      });
      server.sendChatText(
        client,
        `Teleportando para a localização de ${targetClient.character.name}..`
      );
      server.sendWeatherUpdatePacket(client, server.weather);
    },
  },
  {
    name: "silentban",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0] || !args[1]) {
        server.sendChatText(
          client,
          `Uso correto: /silentban {Nome ou Id do jogador} {Tipo} opcional: {Tempo} {Motivo}`
        );
        return;
      }
      const banTypes = ["nodamage", "hiddenplayers", "rick"];
      const banType = args[1].toString().toLowerCase();
      if (!banTypes.includes(banType)) {
        server.sendChatText(client, `Tipos de ban válidos: ${banTypes.join(", ")}.`);
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[0].toString()
      );
      if (server.playerNotFound(client, args[0].toString(), targetClient)) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
        server.sendChatText(client, "Jogador não encontrado.");
        return;
      }
      let time = Number(args[2]) ? Number(args[2]) * 60000 : 0;
      if (time > 0) {
        time += Date.now();
        server.sendChatText(
          client,
          `Você baniu silenciosamente ${
            targetClient.character.name
          } até ${server.getDateString(time)}..`
        );
      } else {
        server.sendChatText(
          client,
          `Você baniu silenciosamente ${targetClient.character.name} permanentemente, tipo de BAN: ${banType}.`
        );
      }
      const reason = args.slice(3).join(" ");
      server.banClient(
        targetClient,
        reason,
        banType,
        client.character.name ? client.character.name : "",
        time
      );
    },
  },
  {
    name: "ban",
    permissionLevel: PermissionLevels.MODERATOR,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          `Uso correto: /ban {Nome ou Id do jogador} opcional: {tempo} {motivo}`
        );
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[0].toString()
      );
      if (server.playerNotFound(client, args[0].toString(), targetClient)) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
        server.sendChatText(client, "Jogador não encontrado..");
        return;
      }
  
      const isAdmin = await server._db.collection(DB_COLLECTIONS.ADMINS).findOne({ SessionId: targetClient.loginSessionId });
      if (isAdmin) {
        server.sendChatText(client, `${targetClient.character.name} é um admin e não pode ser banido...`);
        return;
      }
  
      let time = Number(args[1]) ? Number(args[1]) * 60000 : 0;
      if (time > 0) {
        time += Date.now();
        server.sendChatText(
          client,
          `Você baniu ${
            targetClient.character.name
          } até ${server.getDateString(time)}..`
        );
      } else {
        server.sendChatText(
          client,
          `Você baniu ${targetClient.character.name} permanentemente.`
        );
      }
      const reason = args.slice(2).join(" ");
      server.banClient(
        targetClient,
        reason,
        "normal",
        client.character.name ? client.character.name : "",
        time
      );

      DiscordHook.sendMessageOnBanChannel(`Usuário ${targetClient.character.name} foi banido por ${client.character.name || "Desconhecido"}. Motivo: ${reason}.`);
    },
  },
  {
    name: "kick",
    permissionLevel: PermissionLevels.MODERATOR,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          `Uso correto: /kick {Nome ou Id do jogador} opcional: {motivo}`
        );
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[0].toString()
      );
      if (server.playerNotFound(client, args[0].toString(), targetClient)) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
        server.sendChatText(client, "Jogador não encontrado..");
        return;
      }
      const reason = args[1] ? args.slice(1).join(" ") : "Não informado.";
      for (let i = 0; i < 5; i++) {
        server.sendAlert(
          targetClient,
          `Você está sendo expulso do servidor. Motivo: ${reason}...`
        );
      }

      setTimeout(() => {
        if (!targetClient) {
          return;
        }
        server.sendGlobalChatText(
          `${targetClient.character.name} foi expulso do servidor!`
        );
        server.kickPlayer(targetClient);
      }, 2000);
    },
  },
  {
    name: "unban",
    permissionLevel: PermissionLevels.MODERATOR,
    keepCase: true,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(client, `Uso correto: /unban {Nome ou Id do jogador}`);
        return;
      }
      const name = args.join(" ").toString();
      const unBannedClient = await server.unbanClient(client, name);
      if (unBannedClient) {
        server.sendChatText(
          client,
          `Removido o ban do usuário ${unBannedClient.name}..`
        );
      } else {
        server.sendChatText(
          client,
          `Não foi encontrado nenhum usuário banido com este nome ${name}..`
        );
      }
    },
  },
  {
    name: "gm", // "god" also works
    permissionLevel: PermissionLevels.MODERATOR,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.setGodMode(client, !client.character.godMode);
      server.sendAlert(client, `Godmode setado para ${client.character.godMode}`);
    },
  },
  {
    name: "listprocesses",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          `Uso correto: /listprocesses {Nome ou Id do jogador}`
        );
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[0].toString()
      );
      if (server.playerNotFound(client, args[0].toString(), targetClient)) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
        server.sendChatText(client, "Jogador não encontrado..");
        return;
      }
      server.sendChatText(
        client,
        `Mostrando a lista de processos do usuário: ${targetClient.character.name}.`
      );
      for (let index = 0; index < targetClient.clientLogs.length; index++) {
        const element = targetClient.clientLogs[index];
        server.sendChatText(client, `${element.log}`);
      }
    },
  },
  //#endregion

  //#region ADMIN PERMISSIONS
  {
    name: "parachute",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendChatText(client, "Comando desativado no momento");
      /*
      const characterId = server.generateGuid(),
      loc = new Float32Array([
        client.character.state.position[0],
        client.character.state.position[1] + 700,
        client.character.state.position[2],
        client.character.state.position[3],
      ]),
      vehicle = new Vehicle(
        characterId,
        999999,
        9374,
        loc,
        client.character.state.lookAt,
        server.getGameTime()
      );
      server.sendData(client, "ClientUpdate.UpdateLocation", {
        position: loc,
        triggerLoadingScreen: true,
      });
      vehicle.onReadyCallback = () => {
        // doing anything with vehicle before client gets fullvehicle packet breaks it
        server.mountVehicle(client, characterId);
        // todo: when vehicle takeover function works, delete assignManagedObject call
        server.assignManagedObject(client, vehicle);
        client.vehicle.mountedVehicle = characterId;
      };
      server.worldObjectManager.createVehicle(server, vehicle);
      */
    },
  },
  {
    name: "titan",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendDataToAll("Character.UpdateScale", {
        characterId: client.character.characterId,
        scale: [20, 20, 20, 1],
      });
      server.sendChatText(client, "Tamanho de TITAN");
    },
  },
  {
    name: "poutine",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendDataToAll("Character.UpdateScale", {
        characterId: client.character.characterId,
        scale: [20, 5, 20, 1],
      });
      server.sendChatText(client, "O meme é real.....");
    },
  },
  {
    name: "rat",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendDataToAll("Character.UpdateScale", {
        characterId: client.character.characterId,
        scale: [0.2, 0.2, 0.2, 1],
      });
      server.sendChatText(client, "Tamanho de RATO");
    },
  },
  {
    name: "normalsize",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendDataToAll("Character.UpdateScale", {
        characterId: client.character.characterId,
        scale: [1, 1, 1, 1],
      });
      server.sendChatText(client, "De volta ao tamanho normal");
    },
  },
  {
    name: "despawnobjects",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      client.spawnedEntities.forEach((object) => {
        server.despawnEntity(object.characterId);
      });
      client.spawnedEntities = [];
      server._lootableProps = {};
      server._npcs = {};
      server._spawnedItems = {};
      server._vehicles = {};
      server._doors = {};
      server.sendChatText(client, "Objetos removidos do jogo.", true);
    },
  },
  {
    name: "time",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      const choosenHour = Number(args[0]);
      if (choosenHour < 0) {
        server.sendChatText(client, "Você precisa especificar um horário para setar !!!");
        return;
      }
      server.forceTime(choosenHour * 3600 * 1000);
      server.sendChatText(
        client,
        `Vai forçar o tempo para ser ${
          choosenHour % 1 >= 0.5
            ? Number(choosenHour.toFixed(0)) - 1
            : choosenHour.toFixed(0)
        }:${
          choosenHour % 1 === 0
            ? "00"
            : (((choosenHour % 1) * 100 * 60) / 100).toFixed(0)
        } no próximo sync.....`,
        true
      );
    },
  },
  {
    name: "realtime",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.removeForcedTime();
      server.sendChatText(client, "O jogo agora é baseado no tempo real.", true);
    },
  },
  {
    name: "sfog",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendChatText(
        client,
        `Neblina foi alterada para ${
          server.toggleFog() ? "ATIVA" : "INATIVA"
        }`,
        true
      );
    },
  },
  {
    name: "spamzombies",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[1]) {
        server.sendChatText(
          client,
          "[ERRO] Uso /spamzombies [Distância] [Pontos]."
        );
        return;
      }
      const multiplied = Number(args[0]) * Number(args[1]);
      if (multiplied > 600) {
        server.sendChatText(
          client,
          `[ERRO] Excedeu o limite de [Distância] * [Pontos]: ("${multiplied}"/600).`
        );
        return;
      }
      const range = Number(args[0]),
        lat = client.character.state.position[0],
        long = client.character.state.position[2];
      const points = [];
      let rangeFixed = range;
      const numberOfPoints = Number(args[1]);
      const degreesPerPoint = 360 / numberOfPoints;
      for (let j = 1; j < range; j++) {
        let currentAngle = 0,
          x2,
          y2;
        rangeFixed += -1;
        for (let i = 0; i < numberOfPoints; i++) {
          x2 = Math.cos(currentAngle) * rangeFixed;
          y2 = Math.sin(currentAngle) * rangeFixed;
          const p = [lat + x2, long + y2];
          points.push(p);
          currentAngle += degreesPerPoint;
        }
      }
      points.forEach((obj: any) => {
        server.worldObjectManager.createZombie(
          server,
          9634,
          new Float32Array([
            obj[0],
            client.character.state.position[1],
            obj[1],
            1,
          ]),
          client.character.state.lookAt
        );
      });
    },
  },
  {
    name: "spamied",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[1]) {
        server.sendChatText(client, "[ERRO] Uso /spamied [Distância] [Pontos].");
        return;
      }
      const multiplied = Number(args[0]) * Number(args[1]);
      if (multiplied > 600) {
        server.sendChatText(
          client,
          `[ERRO] Excedeu o limite de [Distância] * [Pontos]: ("${multiplied}"/600).`
        );
        return;
      }
      const range = Number(args[0]),
        lat = client.character.state.position[0],
        long = client.character.state.position[2];
      const points = [];
      let rangeFixed = range;
      const numberOfPoints = Number(args[1]);
      const degreesPerPoint = 360 / numberOfPoints;
      for (let j = 1; j < range; j++) {
        let currentAngle = 0,
          x2,
          y2;
        rangeFixed += -1;
        for (let i = 0; i < numberOfPoints; i++) {
          x2 = Math.cos(currentAngle) * rangeFixed;
          y2 = Math.sin(currentAngle) * rangeFixed;
          const p = [lat + x2, long + y2];
          points.push(p);
          currentAngle += degreesPerPoint;
        }
      }
      points.forEach((obj: any) => {
        const characterId = server.generateGuid();
        server._explosives[characterId] = new ExplosiveEntity(
          characterId,
          server.getTransientId(characterId),
          9176,
          new Float32Array([
            obj[0],
            client.character.state.position[1],
            obj[1],
            1,
          ]),
          client.character.state.lookAt,
          server,
          Items.IED
        ); // save explosive
      });
    },
  },
  {
    name: "spawnnpc",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      const guid = server.generateGuid();
      const transientId = server.getTransientId(guid);
      if (!args[0]) {
        server.sendChatText(client, "[ERRO] Você precisa especificar o Id do modelo !!");
        return;
      }
      const characterId = server.generateGuid();
      const npc = new Npc(
        characterId,
        transientId,
        Number(args[0]),
        client.character.state.position,
        client.character.state.lookAt,
        server
      );
      server._npcs[characterId] = npc; // save npc
    },
  },
  {
    name: "decoy",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0] && !server._decoys[client.character.transientId]) {
        server.sendChatText(client, "Uso /decoy {Nome}");
        return;
      }
      if (server._decoys[client.character.transientId]) {
        if (client.isDecoy) {
          server.sendChatText(client, "Replicação de iscas desabilitada..");
          client.isDecoy = false;
        } else {
          server.sendChatText(client, "Replicação de iscas habilitada..");
          client.isDecoy = true;
        }
        return;
      }
      if (!client.character.isSpectator) {
        server.sendChatText(client, "Você precisa estar no modo espectador para utilizar este comando.");
        return;
      }
      const mimic = client.character.pGetLightweight();
      const characterId = server.generateGuid();
      const decoy = {
        characterId: characterId,
        transientId: client.character.transientId,
        position: new Float32Array(mimic.position),
        action: "",
      };
      server._decoys[client.character.transientId] = decoy;
      mimic.identity.characterName = args[0]
        .split("")
        .map((letter) =>
          Math.random() < 0.7 || !/[a-z]/.test(letter)
            ? letter
            : letter.toUpperCase()
        )
        .join("");
      mimic.characterId = characterId;
      mimic.transientId = client.character.transientId;
      for (const a in server._clients) {
        const c = server._clients[a];
        if (
          isPosInRadius(
            c.character.npcRenderDistance || 250,
            client.character.state.position,
            c.character.state.position
          )
        ) {
          server.sendData(c, "AddLightweightPc", {
            ...mimic,
            mountGuid: "",
            mountSeatId: 0,
            mountRelatedDword1: 0,
          });
          const equipment = client.character.pGetEquipment();
          equipment.characterData.characterId = characterId;
          server.sendData(c, "Equipment.SetCharacterEquipment", equipment);
          server.sendData(c, "LightweightToFullPc", {
            useCompression: false,
            fullPcData: {
              transientId: client.character.transientId,
              attachmentData: client.character.pGetAttachmentSlots(
                client.character.groupId
              ),
              headActor: client.character.headActor,
              hairModel: client.character.hairModel,
              resources: { data: client.character.pGetResources() },
              remoteWeapons: {
                data: client.character.pGetRemoteWeaponsData(server),
              },
            },
            positionUpdate: {
              ...client.character.positionUpdate,
              sequenceTime: server.getGameTime(),
              position: client.character.state.position,
              stance: client.character.stance,
            },
            stats: client.character.getStats().map((stat: any) => {
              return stat.statData;
            }),
            remoteWeaponsExtra:
              client.character.pGetRemoteWeaponsExtraData(server),
          });
        }
      }
      client.isDecoy = true;
      server.sendChatText(client, "Decoy replication enabled");
    },
  },
  {
    name: "deletedecoys",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      for (const a in server._decoys) {
        server.sendDataToAll("Character.RemovePlayer", {
          characterId: server._decoys[a].characterId,
        });
        delete server._decoys[a];
      }
      for (const a in server._clients) {
        if (server._clients[a].isDecoy) {
          server._clients[a].isDecoy = false;
        }
      }
      server.sendChatText(client, `Removed all decoys`, false);
    },
  },
  {
    name: "dynamicweather",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!server._dynamicWeatherEnabled) {
        server._dynamicWeatherEnabled = true;
        server.sendChatText(client, "Clima dinâmico ativado !!");
      } else {
        server.sendChatText(client, "Clima dinâmico já está ativado !!!!");
      }
    },
  },
  {
    name: "weather",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (server._dynamicWeatherEnabled) {
        server._dynamicWeatherEnabled = false;
        server.sendChatText(client, "Clima dinâmico desativado !!");
      }
      const weatherTemplate = server._soloMode
        ? server._weatherTemplates[args[0]]
        : _.find(
            server._weatherTemplates,
            (template: { templateName: any }) => {
              return template.templateName === args[0];
            }
          );
      if (!args[0]) {
        server.sendChatText(
          client,
          "Por favor defina um modelo de clima para utilizar (data/2016/dataSources/weather.json)"
        );
      } else if (weatherTemplate) {
        server.weather = weatherTemplate;
        server.sendWeatherUpdatePacket(client, server.weather, true);
        server.sendChatText(client, `Modelo de clima aplicado: "${args[0]}"`);
      } else {
        if (args[0] === "list") {
          server.sendChatText(client, `Modelos de clima :`);
          _.forEach(
            server._weatherTemplates,
            (element: { templateName: any }) => {
              server.sendChatText(client, `- ${element.templateName}`);
            }
          );
        } else {
          server.sendChatText(client, `"${args[0]}" não é um modelo de clima..`);
          server.sendChatText(
            client,
            `Utilize "/weather list" para listar todos os modelos disponíveis.`
          );
        }
      }
    },
  },
  {
    name: "savecurrentweather",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          "Por favor defina um nome para o tema do seu clima '/savecurrentweather {nome}'"
        );
      } else if (server._weatherTemplates[args[0]]) {
        server.sendChatText(client, `"${args[0]}" já existe !!`);
      } else {
        const currentWeather = server.weather;
        if (currentWeather) {
          currentWeather.templateName = args[0];
          if (server._soloMode) {
            server._weatherTemplates[currentWeather.templateName as string] =
              currentWeather;
            fs.writeFileSync(
              `${__dirname}/../../../../data/2016/dataSources/weather.json`,
              JSON.stringify(server._weatherTemplates, null, "\t")
            );
            delete require.cache[
              require.resolve("../../../../data/2016/dataSources/weather.json")
            ];
            server._weatherTemplates = require("../../../../data/2016/dataSources/weather.json");
          } else {
            await server._db?.collection("weathers").insertOne(currentWeather);
            server._weatherTemplates = await (server._db as any)
              .collection("weathers")
              .find()
              .toArray();
          }
          server.sendChatText(client, `modelo "${args[0]}" salvo !`);
        } else {
          server.sendChatText(client, `Não foi possível salvar o clima atual..`);
          server.sendChatText(client, `Por favor reporte isso`);
        }
      }
    },
  },
  {
    name: "randomweather",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (server._dynamicWeatherEnabled) {
        server._dynamicWeatherEnabled = false;
        server.sendChatText(client, "Clima dinâmico removido !!");
      }
      server.sendChatText(client, `Clima aleatório.`);

      function rnd_number(max: any, fixed: boolean = false) {
        const num = Math.random() * max;
        return Number(fixed ? num.toFixed(0) : num);
      }

      server.weather = {
        ...server.weather,
        //name: "sky_dome_600.dds", todo: use random template from a list
        /*
              unknownDword1: 0,
              unknownDword2: 0,
              skyBrightness1: 1,
              skyBrightness2: 1,
              */
        rain: rnd_number(200, true),
        temp: rnd_number(80, true),
        colorGradient: rnd_number(1),
        unknownDword8: rnd_number(1),
        unknownDword9: rnd_number(1),
        unknownDword10: rnd_number(1),
        unknownDword11: 0,
        unknownDword12: 0,
        sunAxisX: rnd_number(360, true),
        sunAxisY: rnd_number(360, true),
        unknownDword15: 0,
        windDirectionX: rnd_number(360, true),
        windDirectionY: rnd_number(360, true),
        windDirectionZ: rnd_number(360, true),
        wind: rnd_number(100, true),
        unknownDword20: 0,
        unknownDword21: 0,
        unknownDword22: 0,
        unknownDword23: 0,
        unknownDword24: 0,
        unknownDword25: 0,
        unknownDword26: 0,
        unknownDword27: 0,
        unknownDword28: 0,
        unknownDword29: 0,

        AOSize: rnd_number(0.5),
        AOGamma: rnd_number(0.2),
        AOBlackpoint: rnd_number(2),

        unknownDword33: 0,
      };
      server.sendWeatherUpdatePacket(client, server.weather, true);
    },
  },
  {
    name: "additem",
    permissionLevel: PermissionLevels.DEV,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          "[ERRO] Uso /additem {Id ou Nome do item} opcional: {quantidade} {Nome ou Id do jogador}"
        );
        return;
      }
      const count = Number(args[1]) || 1;
      let itemDefId;
      let similar;

      for (const a in itemDefinitions) {
        const name = itemDefinitions[a].NAME;
        const argsName = args[0].toString().toUpperCase().replaceAll("_", " ");
        if (!name) continue;
        if (itemDefinitions[a].CODE_FACTORY_NAME == "AccountRecipe") continue;
        if (itemDefinitions[a].CODE_FACTORY_NAME == "EquippableContainer") {
          if (itemDefinitions[a].BULK == 0) continue; // skip account recipes and world containers
        }
        if (name.toUpperCase() == argsName) {
          itemDefId = itemDefinitions[a].ID;
          break;
        } else if (
          getDifference(name.toUpperCase(), argsName) <= 3 &&
          getDifference(name.toUpperCase(), argsName) != 0
        )
          similar = itemDefinitions[a].NAME.toUpperCase().replaceAll(" ", "_");
      }
      if (!itemDefId) itemDefId = Number(args[0]);
      const item = server.generateItem(itemDefId, count);
      if (!item) {
        server.sendChatText(
          client,
          similar
            ? `[ERRO] Não foi possível encontrar o item "${args[0].toUpperCase()}", você quis dizer "${similar}..."`
            : `[ERRO] Não foi possível encontrar encontrar o item "${args[0]}.."`
        );
        return;
      }
      if (args[2]) {
        const targetClient = server.getClientByNameOrLoginSession(
          args[2].toString()
        );
        if (typeof targetClient == "string") {
          server.sendChatText(
            client,
            `Não foi possível encontrar encontrar o jogador ${args[2]
              .toString()
              .toUpperCase()}, você quis dizer ${targetClient.toUpperCase()}..`
          );
          return;
        }
        if (args[2] && !targetClient) {
          server.sendChatText(client, "Jogador não encontrado.");
          return;
        }
        server.sendChatText(
          client,
          `Adicionando ${count}x ${
            count == 1 ? "item" : "itens"
          } com Id ${itemDefId} para o jogador ${
            targetClient ? targetClient.character.name : client.character.name
          }`
        );
        (targetClient ? targetClient.character : client.character).lootItem(
          server,
          item
        );
      } else {
        server.sendChatText(
          client,
          `Adicionando ${count}x ${
            count == 1 ? "item" : "itens"
          } com Id ${itemDefId} para o jogador ${client.character.name}`
        );
        client.character.lootItem(server, item);
      }
    },
  },
  {
    name: "lighting",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0]) {
        server.sendChatText(client, "[ERROR] Missing lighting file.");
        return;
      }

      server.sendData(client, "SendZoneDetails", {
        zoneName: "Z1",
        zoneType: 4,
        unknownBoolean1: false,
        skyData: server.weather,
        zoneId1: 5,
        zoneId2: 5,
        nameId: 7699,
        unknownBoolean2: true,
        lighting: args[0],
        unknownBoolean3: false,
      });
    },
  },
  {
    name: "kit",
    permissionLevel: PermissionLevels.DEV,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      client.character.equipLoadout(server, characterKitLoadout);
    },
  },
  {
    name: "addallitems",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendChatText(client, "Comando desabilitado no momento");
      /*
      server.sendChatText(client, "Adding 1x of all items to inventory.");
      for (const itemDef of Object.values(server._itemDefinitions)) {
        server.lootItem(client, server.generateItem(itemDef.ID));
      }
      */
    },
  },
 /* {
     name: "shutdown",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      const timeLeft = args[0] ? args[0] : 0;
      const message = args[1] ? args[1] : " ";
      const startedTime = Date.now();
      await zoneShutdown(server, startedTime, Number(timeLeft), message);
    },	
  },*/
  {
    name: "spawnloot",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.worldObjectManager.createLoot(server);
      server.sendChatText(client, `Loot respawnado`);
    },
  },
  {
    name: "respawnnpcs",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.worldObjectManager.createNpcs(server);
      server.sendChatText(client, `Npcs respawnado`);
    },
  },
  {
    name: "respawnvehicles",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.worldObjectManager.createVehicles(server);
      server.sendChatText(client, `Veículos respawnados.`);
    },
  },
  {
    name: "lootrespawntimer",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0]) {
        server.sendChatText(client, `Uso correto: /lootrespawntimer {Tempo}`);
        return;
      }
      server.worldObjectManager.lootRespawnTimer = Number(args[0]);
      server.sendChatText(
        client,
        `Tempo de respawn para LOOT setado em ${Number(args[0])}`
      );
    },
  },
  {
    name: "npcrespawntimer",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0]) {
        server.sendChatText(client, `Correct usage: /npcrespawntimer <time>`);
        return;
      }
      server.worldObjectManager.npcRespawnTimer = Number(args[0]);
      server.sendChatText(
        client,
        `Tempo de respawn para NPC setado em ${Number(args[0])}`
      );
    },
  },
  {
    name: "vehiclerespawntimer",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          `Uso correto: /vehiclerespawntimer {Tempo}`
        );
        return;
      }
      server.worldObjectManager.vehicleRespawnTimer = Number(args[0]);
      server.sendChatText(
        client,
        `Tempo de respawn para VEÍCULOS setado em ${Number(args[0])}.`
      );
    },
  },
  {
    name: "alert",
    permissionLevel: PermissionLevels.ADMIN,
    keepCase: true,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendAlertToAll(args.join(" "));
    },
  },
  {
    name: "remover",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      const wep = server.generateItem(Items.WEAPON_REMOVER);
      if (wep && wep.weapon) wep.weapon.ammoCount = 100;
      client.character.lootItem(server, wep);
    },
  },
  {
    name: "players",
    permissionLevel: PermissionLevels.MODERATOR,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendChatText(
        client,
        `Players: ${Object.values(server._clients)
          .map((c) => {
            return `${c.character.name}: ${c.loginSessionId} | ${
              server.getSoeClient(c.soeClientId)?.getNetworkStats()[2]
            } | ${server.getSoeClient(c.soeClientId)?.getNetworkStats()[0]} | ${
              server.getSoeClient(c.soeClientId)?.getNetworkStats()[1]
            }`;
          })
          .join(",\n")}`
      );
    },
  },
  {
    name: "slay",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(client, `Uso correto: /slay {Nome ou Id do jogador}`);
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[0].toString()
      );
      if (server.playerNotFound(client, args[0].toString(), targetClient)) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
        server.sendChatText(client, "Cliente não encontrado..");
        return;
      }
      server.sendGlobalChatText(
        `${targetClient.character.name} foi obliterado`
      );
      const damageInfo: DamageInfo = {
        entity: client.character.characterId,
        damage: 999999999,
      };
      server.killCharacter(targetClient, damageInfo);
    },
  },
  {
    name: "savecharacters",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!server.enableWorldSaves) {
        server.sendChatText(client, "Salvar servidor está desabilitado..");
        return;
      }
      server.sendChatText(client, "Salvando informações de personagens...");
      const characters = WorldDataManager.convertCharactersToSaveData(
        Object.values(server._characters),
        server._worldId
      );
      await server.worldDataManager.saveCharacters(characters);
      server.sendChatText(client, "Informações de personagens foram salvas!!!");
    },
  },
  {
    name: "savevehicles",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!server.enableWorldSaves) {
        server.sendChatText(client, "Salvar servidor está desabilitado..");
        return;
      }
      server.sendChatText(client, "Salvando informações de veículos....");
      // await server.worldDataManager.saveVehicles(server);
      server.sendChatText(client, "Veículos salvos!!");
    },
  },
  {
    name: "save",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!server.enableWorldSaves) {
        server.sendChatText(client, "Salvar servidor está desabilitado..");
        return;
      }

      await server.saveWorld();
    },
  },
  {
    name: "nextsave",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!server.enableWorldSaves) {
        server.sendChatText(client, "Salvar servidor está desabilitado..");
        return;
      }
      server.sendChatText(
        client,
        `Próximo save às ${new Date(server.nextSaveTime)}..`
      );
    },
  },
  {
    name: "disablesave",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!server.enableWorldSaves) {
        server.sendChatText(client, "Salvar servidor já está desabilitado...");
        return;
      }

      server.enableWorldSaves = false;
      server.sendAlertToAll("Salvando mundo foi desabilitado.");
    },
  },
  {
    name: "enablesave",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (server.enableWorldSaves) {
        server.sendChatText(client, "Salvando servidor já está habilitado...");
        return;
      }

      server.enableWorldSaves = true;
      server.sendAlertToAll("Salvando mundo foi habilitado.");
    },
  },
  {
    name: "deletebase",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          `Uso correto: /deleteBase {Distância}. `
        );
        return;
      }
      if (Number(args[0]) > 100) {
        server.sendChatText(client, `Distância máxima é 100...`);
        return;
      }
      const entitiesToDelete: { characterId: string; dictionary: any }[] = [];
      for (const a in server._constructionSimple) {
        const construction = server._constructionSimple[a];
        if (
          isPosInRadius(
            Number(args[0]),
            client.character.state.position,
            construction.state.position
          )
        ) {
          construction.destroy(server);
        }
      }
      for (const a in server._constructionDoors) {
        const construction = server._constructionDoors[a];
        if (
          isPosInRadius(
            Number(args[0]),
            client.character.state.position,
            construction.state.position
          )
        ) {
          construction.destroy(server);
        }
      }
      for (const a in server._constructionFoundations) {
        const construction = server._constructionFoundations[a];
        if (
          isPosInRadius(
            Number(args[0]),
            client.character.state.position,
            construction.state.position
          )
        ) {
          construction.destroy(server);
        }
      }
      for (const a in server._lootableConstruction) {
        const construction = server._lootableConstruction[a];
        if (
          isPosInRadius(
            Number(args[0]),
            client.character.state.position,
            construction.state.position
          )
        ) {
          construction.destroy(server);
        }
      }

      for (const a in server._worldLootableConstruction) {
        const construction = server._worldLootableConstruction[a];
        if (
          isPosInRadius(
            Number(args[0]),
            client.character.state.position,
            construction.state.position
          )
        ) {
          construction.destroy(server);
        }
      }

      for (const a in server._temporaryObjects) {
        const construction = server._temporaryObjects[a];
        if (
          isPosInRadius(
            Number(args[0]),
            client.character.state.position,
            construction.state.position
          )
        ) {
          entitiesToDelete.push({
            characterId: construction.characterId,
            dictionary: server._temporaryObjects,
          });
        }
      }

      for (const a in server._traps) {
        const construction = server._traps[a];
        if (
          isPosInRadius(
            Number(args[0]),
            client.character.state.position,
            construction.state.position
          )
        ) {
          entitiesToDelete.push({
            characterId: construction.characterId,
            dictionary: server._traps,
          });
        }
      }

      for (const a in server._plants) {
        const construction = server._plants[a];
        if (
          isPosInRadius(
            Number(args[0]),
            client.character.state.position,
            construction.state.position
          )
        ) {
          entitiesToDelete.push({
            characterId: construction.characterId,
            dictionary: server._plants,
          });
        }
      }

      entitiesToDelete.forEach(
        (entity: { characterId: string; dictionary: any }) => {
          server.deleteEntity(entity.characterId, entity.dictionary, 1875, 500);
        }
      );
      server.sendChatText(
        client,
        `Removido todas as contruções em uma distância de ${Number(args[0])}...`
      );
    },
  },
  {
    name: "build",
    permissionLevel: PermissionLevels.DEV,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      client.character.equipItem(
        server,
        server.generateItem(Items.FANNY_PACK_DEV)
      );
      client.character.equipLoadout(server, characterBuildKitLoadout);
      server.sendChatText(client, `Kit de construção adquirido..`);
    },
  },
  {
    name: "debug",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (server: ZoneServer2016, client: Client) => {
      client.isDebugMode = !client.isDebugMode;
      server.sendAlert(client, `Modo debug ativado para ${client.isDebugMode}`);
    },
  },
  {
    name: "listbases",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          `"[ERROR] Uso /findbases {Nome ou Id do jogador}"`
        );
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[0].toString()
      );
      if (server.playerNotFound(client, args[0].toString(), targetClient)) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
        server.sendChatText(client, "Jogador não encontrado..");
        return;
      }
      server.sendChatText(
        client,
        `Listando todas as bases de ${targetClient.character.name}:`
      );
      let counter = 1;
      for (const a in server._constructionFoundations) {
        const foundation = server._constructionFoundations[a];
        const name = server.getItemDefinition(foundation.itemDefinitionId).NAME;
        if (
          foundation.ownerCharacterId === targetClient.character.characterId
        ) {
          const pos = `[${foundation.state.position[0]} ${foundation.state.position[1]} ${foundation.state.position[2]}]`;
          server.sendChatText(
            client,
            `${counter}. ${name}: Posição ${pos}, Permissões: Dono...`
          );
          counter++;
          continue;
        }
        Object.values(foundation.permissions).forEach(
          (permission: ConstructionPermissions) => {
            if (permission.characterId === targetClient.character.characterId) {
              const pos = `[${foundation.state.position[0]} ${foundation.state.position[1]} ${foundation.state.position[2]}]`;
              server.sendChatText(
                client,
                `${counter}. ${name}: Posição ${pos}, Permissões: Construção: ${permission.build}, Demolição: ${permission.demolish}, Containers: ${permission.useContainers}, Visitante: ${permission.visit}........`
              );
              counter++;
            }
          }
        );
      }
    },
  },
  {
    name: "getinventory",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          `"[ERRO] Uso /getinventory {Nome ou Id do jogador}"`
        );
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[0].toString()
      );
      if (server.playerNotFound(client, args[0].toString(), targetClient)) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
        server.sendChatText(client, "Jogador não encontrado.");
        return;
      }
      server.sendChatText(
        client,
        `Listando todos os itens de ${targetClient.character.name}:`
      );
      let counter = 0;
      server.sendChatText(client, `LOADOUT:`);
      Object.values(targetClient.character._loadout).forEach(
        (item: LoadoutItem) => {
          const name = server.getItemDefinition(item.itemDefinitionId).NAME;
          counter++;
          server.sendChatText(
            client,
            `${counter}. ${name ? name : item.itemDefinitionId}, count: ${
              item.stackCount
            }`
          );
        }
      );
      counter = 0;
      server.sendChatText(client, " ");
      server.sendChatText(client, `CONTAINERS:`);
      Object.values(targetClient.character._containers).forEach(
        (container: LoadoutContainer) => {
          server.sendChatText(client, " ");
          const containerName = server.getItemDefinition(
            container.itemDefinitionId
          ).NAME;
          server.sendChatText(
            client,
            `${
              containerName ? containerName : container.itemDefinitionId
            } [${container.getUsedBulk(server)}/${container.getMaxBulk(
              server
            )}]:`
          );
          Object.values(container.items).forEach((item: BaseItem) => {
            counter++;
            const itemName = server.getItemDefinition(
              item.itemDefinitionId
            ).NAME;
            server.sendChatText(
              client,
              `${counter}. ${
                itemName ? itemName : item.itemDefinitionId
              }, count: ${item.stackCount}`
            );
          });
        }
      );
    },
  },
  {
    name: "listpermissions",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (server: ZoneServer2016, client: Client) => {
      if (!client.character.currentInteractionGuid) {
        server.sendChatText(client, `[ERROR] No interaction target`);
        return;
      }
      const foundation = server._constructionFoundations[
        client.character.currentInteractionGuid
      ] as ConstructionParentEntity;
      if (!foundation) {
        server.sendChatText(client, `[ERROR] Target is not a foundation`);
        return;
      }
      server.sendChatText(
        client,
        `Displaying list of permissions for foundation: ${foundation.characterId}, owner: ${foundation.ownerCharacterId}`
      );
      Object.values(foundation.permissions).forEach((permission: any) => {
        server.sendChatText(client, JSON.stringify(permission));
      });
    },
  },
  {
    name: "respawnloot",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      for (const characterId in server._spawnedItems) {
        const item = server._spawnedItems[characterId];
        if (item.spawnerId > 0) {
          if (
            item.item.itemDefinitionId === Items.FUEL_BIOFUEL ||
            item.item.itemDefinitionId === Items.FUEL_ETHANOL
          ) {
            server.deleteEntity(characterId, server._explosives);
          }
          server.deleteEntity(characterId, server._spawnedItems);
          delete server.worldObjectManager._spawnedLootObjects[item.spawnerId];
        }
      }

      delete require.cache[require.resolve("../data/lootspawns")];
      const loottables = require("../data/lootspawns").lootTables;
      server.worldObjectManager.createLoot(server, loottables);
      server.sendChatText(client, `Loot respawnado`);
    },
  },
  {
    name: "heal",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      client.character._resources = {
        [ResourceIds.HEALTH]: 10000,
        [ResourceIds.STAMINA]: 600,
        [ResourceIds.HUNGER]: 10000,
        [ResourceIds.HYDRATION]: 10000,
        [ResourceIds.VIRUS]: 0,
        [ResourceIds.COMFORT]: 5000,
        [ResourceIds.BLEEDING]: -40,
      };
      client.character.updateResource(
        server,
        client,
        ResourceIds.HEALTH,
        ResourceTypes.HEALTH
      );
      client.character.updateResource(
        server,
        client,
        ResourceIds.STAMINA,
        ResourceTypes.STAMINA
      );
      client.character.updateResource(
        server,
        client,
        ResourceIds.HUNGER,
        ResourceTypes.HUNGER
      );
      client.character.updateResource(
        server,
        client,
        ResourceIds.HYDRATION,
        ResourceTypes.HYDRATION
      );
      client.character.updateResource(
        server,
        client,
        ResourceIds.VIRUS,
        ResourceTypes.VIRUS
      );
      client.character.updateResource(
        server,
        client,
        ResourceIds.COMFORT,
        ResourceTypes.COMFORT
      );
      client.character.updateResource(
        server,
        client,
        ResourceIds.BLEEDING,
        ResourceTypes.BLEEDING
      );

      server.sendChatText(client, `Seta os recursos para o valor máximo..`);
    },
  },
  {
    name: "whisper",
    permissionLevel: PermissionLevels.DEFAULT,
    keepCase: true,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          "[Whisper] Você precisa espicificar o nome do jogador e a mensagem!!"
        );
        return;
      }
      if (!args[1]) {
        server.sendChatText(client, "[Whisper] A mensagem não pode estar em branco!!");
        return;
      }

      const targetClient = server.getClientByNameOrLoginSession(args[0]);
      if (server.playerNotFound(client, args[0].toString(), targetClient)) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
        server.sendChatText(client, "Jogador não encontrado..");
        return;
      }

      if (await server.chatManager.checkMute(server, client)) {
        server.sendChatText(
          client,
          "[Whisper] Mensagem bloqueada, você está mutado globalmente!!!"
        );
        return;
      }
      if (
        targetClient.character.mutedCharacters.includes(
          client.character.characterId
        )
      ) {
        server.sendChatText(
          client,
          `[Whisper] Mensagem bloqueada, jogador alvo te mutou!`
        );
        return;
      }

      args.splice(0, 1);
      const message = args.join(" ");

      server.sendChatText(
        client,
        `[Whisper to ${targetClient.character.name}]: ${message}`
      );
      server.sendChatText(
        targetClient,
        `[Whisper from ${client.character.name}]: ${message}`
      );
    },
  },
  {
    name: "mute",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(client, "Você precisa especificar o nome do jogador para mutar!!");
        return;
      }

      const targetClient = server.getClientByNameOrLoginSession(args[0]);
      if (server.playerNotFound(client, args[0].toString(), targetClient)) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
        server.sendChatText(client, "Jogador não encontrado..");
        return;
      }

      if (
        client.character.mutedCharacters.includes(
          targetClient.character.characterId
        )
      ) {
        server.sendChatText(
          client,
          `${targetClient.character.name} já está mutado...`
        );
        return;
      }

      client.character.mutedCharacters.push(targetClient.character.characterId);
      server.sendChatText(
        client,
        `Você mutou ${targetClient.character.name}..`
      );
    },
  },
  {
    name: "unmute",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          "Você precisa especificar o nome do jogador para mutar!!"
        );
        return;
      }

      const targetClient = server.getClientByNameOrLoginSession(args[0]);
      if (server.playerNotFound(client, args[0].toString(), targetClient)) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
        server.sendChatText(client, "Jogador não encontrado.");
        return;
      }

      if (
        !client.character.mutedCharacters.includes(
          targetClient.character.characterId
        )
      ) {
        server.sendChatText(
          client,
          `${targetClient.character.name} não está mutado...`
        );
        return;
      }

      client.character.mutedCharacters.splice(
        client.character.mutedCharacters.indexOf(
          targetClient.character.characterId
        ),
        1
      );
      server.sendChatText(
        client,
        `Você desmutou ${targetClient.character.name}..`
      );
    },
  },
  {
    name: "globalmute",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          `Uso correto: /globalmute {Nome ou Id do jogador} opcional: {Tempo} {Motivo}`
        );
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[0].toString()
      );
      if (server.playerNotFound(client, args[0].toString(), targetClient)) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
        server.sendChatText(client, "Jogador não encontrado..");
        return;
      }

      const mutedClient = (await server._db
        ?.collection(DB_COLLECTIONS.MUTED)
        .findOne({
          name: client.character.name.toLowerCase(),
          active: true,
        })) as unknown as ClientMute;
      if (mutedClient) {
        server.sendChatText(client, "Jogador já está mutado!!");
        return;
      }

      let time = Number(args[1]) ? Number(args[1]) * 60000 : 0;
      if (time > 0) {
        time += Date.now();
        server.sendChatText(
          client,
          `Você mutou ${
            targetClient.character.name
          } até ${server.getDateString(time)}..`
        );
      } else {
        server.sendChatText(
          client,
          `Você mutou ${targetClient.character.name} permanentemente..`
        );
      }
      const reason = args.slice(2).join(" ");
      server.chatManager.muteClient(
        server,
        targetClient,
        reason,
        client.character.name ? client.character.name : "",
        time
      );
    },
  },
  {
    name: "globalunmute",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          `Uso correto: /globalunmute {Nome ou Id do jogador}`
        );
        return;
      }
      const name = args.join(" ").toString(),
        mutedClient = (
          await server._db?.collection(DB_COLLECTIONS.MUTED).findOneAndUpdate(
            { name, active: true },
            {
              $set: { active: false, unmuteAdminName: client.character.name },
            }
          )
        )?.value as unknown as ClientMute;
      if (mutedClient) {
        server.sendChatText(client, `Removeu o mute do usuário ${mutedClient.name}.`);
        const targetClient = server.getClientByNameOrLoginSession(
          mutedClient.loginSessionId
        );
        if (targetClient && targetClient instanceof Client) {
          server.sendAlert(targetClient, "Você foi desmutado!!");
        }
      } else {
        server.sendChatText(
          client,
          `Não foi encontrado nenhum usuário mutado com o nome ${name}..`
        );
      }
    },
  },
  {
    name: "console",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      /* handled clientside */
    },
  },
  {
    name: "group",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      server.groupManager.handleGroupCommand(server, client, args);
    },
  },
  
  //#endregion

  //#region DEV PERMISSIONS
  {
    name: "dev",
    permissionLevel: PermissionLevels.DEV,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      const commandName = args[0];
      delete require.cache[require.resolve("./dev")];
      const dev = require("./dev").default;
      if (!!dev[commandName]) {
        if (
          client.isAdmin ||
          commandName === "list" ||
          server._allowedCommands.length === 0 ||
          server._allowedCommands.includes(commandName)
        ) {
          dev[commandName](server, client, args);
        } else {
          server.sendChatText(client, "Você não tem acesso a isso...");
        }
      } else {
        server.sendChatText(
          client,
          `Comando desconhecido: "/dev ${commandName}", veja todos os comandos de Dev utilizando: "/dev list"`
        );
      }
    },
  },
  //#endregion
];
