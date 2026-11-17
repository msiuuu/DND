// Narrator slots for the game. Each slot is a DM the player can pick under Settings, Table, Your DM.
// Fill in a slot's name and voice and it appears in that list under its name; leave both empty and it shows as an empty slot.
//   name:  what the DM is called. It labels every scene and note.
//   voice: what this DM is like at the table, in a few sentences. This is given to the model that speaks as the DM.
// Cali and the plain DM are built into the game itself and do not need a slot.
window.NARRATOR_SLOTS = [
  {id:'slot1', name:'', voice:''},
  {id:'slot2', name:'', voice:''},
  {id:'slot3', name:'', voice:''},
];
