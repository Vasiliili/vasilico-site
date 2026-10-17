/* Inputs and assumptions are kept separate from the thermal engine. */
globalThis.HEATER_DATA={
 volumes:[10,15,25,30,50,65,80,100,120,150,200],heatCapacity:0.001163,reserveFactor:1.2,
 defaults:{volume:80,power:2,stored:60,cold:10,mixed:38,people:2,minutes:8,showerFlow:8,pause:0,bathLitres:120,bathFlow:10,basinLitres:10,basinFlow:4,kitchenLitres:15,kitchenFlow:5,during:false,active:['shower']},
 fixtures:[{id:'shower',name:'Душ',icon:'M12 54V18c0-15 27-15 27 0M26 22h27l-5-7H31ZM31 30v5m10-5v5m10-5v5M31 43v5m10-5v5m10-5v5'},{id:'bath',name:'Ванна',icon:'M5 30h54M8 30v10c0 11 48 11 48 0V30M16 50v7m32-7v7M13 29V14c0-9 14-9 14 0v5'},{id:'basin',name:'Умывальник',icon:'M6 30h52c-3 17-49 17-52 0ZM27 43v14h10V43M31 28V13h13v7'},{id:'kitchen',name:'Кухня',icon:'M6 31h52v19H6ZM19 30V18c0-17 25-17 25 0v6M38 24h13M13 56h38'}]
};
if(typeof module!=='undefined')module.exports=globalThis.HEATER_DATA;
