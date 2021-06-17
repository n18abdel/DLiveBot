const delayExplainer =
  "Si le délai entre la fin d'un stream, et le début d'un nouveau stream avec le même titre est inférieur au délai paramétré :" +
  "\n" +
  "__*startTimeStream2 - endTimeStream1 < sameTitleDelay*__" +
  "\n" +
  ":arrow_forward: il n'y aura pas de nouvelle alerte, l'ancienne alerte sera éditée à la place";

module.exports = {
  delayExplainer,
};
