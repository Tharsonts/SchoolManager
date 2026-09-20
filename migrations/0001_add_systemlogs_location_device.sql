-- Enriquecimento de logs: localização e dispositivo
-- Adiciona colunas no systemLogs para cidade, região, país, coordenadas e detalhes de dispositivo

ALTER TABLE `systemLogs` ADD COLUMN `locationCity` text;
ALTER TABLE `systemLogs` ADD COLUMN `locationRegion` text;
ALTER TABLE `systemLogs` ADD COLUMN `locationCountry` text;
ALTER TABLE `systemLogs` ADD COLUMN `latitude` real;
ALTER TABLE `systemLogs` ADD COLUMN `longitude` real;
ALTER TABLE `systemLogs` ADD COLUMN `timezone` text;
ALTER TABLE `systemLogs` ADD COLUMN `deviceType` text;
ALTER TABLE `systemLogs` ADD COLUMN `os` text;
ALTER TABLE `systemLogs` ADD COLUMN `osVersion` text;
ALTER TABLE `systemLogs` ADD COLUMN `browser` text;
ALTER TABLE `systemLogs` ADD COLUMN `browserVersion` text;