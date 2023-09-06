declare module "h1z1-server";
export var SOEInputStream: typeof import("./out/servers/SoeServer/soeinputstream.js").SOEInputStream;
export var SOEOutputStream: typeof import("./out/servers/SoeServer/soeoutputstream.js").SOEOutputStream;
export var SOEProtocol: typeof import("./out/protocols/soeprotocol.js").SOEProtocol;
export var LoginProtocol: typeof import("./out/protocols/loginprotocol.js").LoginProtocol;
export var GatewayProtocol: typeof import("./out/protocols/gatewayprotocol.js").GatewayProtocol;
export var H1Z1Protocol: typeof import("./out/protocols/h1z1protocol.js").H1Z1Protocol;
export var SOEClient: typeof import("./out/clients/soeclient.js").SOEClient;
export var SOEClientClass: typeof import("./out/servers/SoeServer/soeclient.js").default;
export var LoginClient: typeof import("./out/clients/loginclient.js").LoginClient;
export var GatewayClient: typeof import("./out/clients/gatewayclient.js").GatewayClient;
export var ZoneClient: typeof import("./out/clients/zoneclient.js").ZoneClient;
export var ZoneClientClass: typeof import("./out/servers/ZoneServer2015/classes/zoneclient.js").ZoneClient;
export var SOEServer: typeof import("./out/servers/SoeServer/soeserver.js").SOEServer;
export var LoginServer: typeof import("./out/servers/LoginServer/loginserver.js").LoginServer;
export var GatewayServer: typeof import("./out/servers/GatewayServer/gatewayserver.js").GatewayServer;
export var ZoneServer: typeof import("./out/servers/ZoneServer2015/zoneserver.js").ZoneServer2015; // legacy 
export var ZoneServer2015: typeof import("./out/servers/ZoneServer2015/zoneserver.js").ZoneServer2015; 
export var ZoneServer2016: typeof import("./out/servers/ZoneServer2016/zoneserver.js").ZoneServer2016;
export var BasePlugin: typeof import("./out/servers/ZoneServer2016/managers/pluginmanager.js").BasePlugin;
export var Utils: typeof import("./out/utils/utils");
