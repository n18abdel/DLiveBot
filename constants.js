const delayExplainer = {
  fr:
    "Si le délai entre la fin d'un stream, et le début d'un nouveau stream avec le même titre est inférieur au délai paramétré :" +
    "\n" +
    "__*startTimeStream2 - endTimeStream1 < sameTitleDelay*__" +
    "\n" +
    ":arrow_forward: il n'y aura pas de nouvelle alerte, l'ancienne alerte sera éditée à la place",

  "en-US":
    "If the delay between the end of as stream, and the beginning of a new one with the same title is smaller than the configured delay:" +
    "\n" +
    "__*startTimeStream2 - endTimeStream1 < sameTitleDelay*__" +
    "\n" +
    ":arrow_forward: then there will not be any new alert, the previous one will be edited instead",
};

module.exports = {
  delayExplainer,
};
