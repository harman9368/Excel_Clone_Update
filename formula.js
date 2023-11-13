for(let i=0;i<allCells.length;i++){
    //allCells[i].addEventListener("focus", function () {
      //  console.log("focus",allCells[i]);
    //})
    // blur event listener
    // to save the user entered value into database for later use
    allCells[i].addEventListener("blur", function () {
        let data = allCells[i].innerText;
        let address = addressInput.value;
        
        //console.log(address);
        //console.log(allCells[i]);
        let rid = allCells[i].getAttribute("rid");
        let cid = allCells[i].getAttribute("cid");
        //let {rid, cid} = getRIDCICfromAddress(address);
        let cellObject = sheetDB[rid][cid];
        // cell click -> no change
        if(cellObject.value == data){
            return;
        }
        
        // formula -> manual set
        if(cellObject.formula){
            removeFormula(cellObject,address);
            formulaBar.value="";
        }
        // database make your so later someone could use your value to evaluate there formula
        cellObject.value = data;
        //to update the children or to re-evaluate the formula
        updateChildren(cellObject);
    })
}

// formula bar pe formula set krte ho
formulaBar.addEventListener("keydown", function(e) {
    if(e.key == "Enter" && formulaBar.value){
        // user input formula
        let currentFormula = formulaBar.value;
        let address = addressInput.value;
        let {rid,cid} = getRIDCICfromAddress(address);
        let cellObject = sheetDB[rid][cid];
        if(currentFormula != cellObject.formula){
            removeFormula(cellObject,address);
        }
        // formal -> value get
        let value = evaluateFormula(currentFormula);
        
        // given for which we are setting the formula -> UI , BB Update
        setCell(value, currentFormula);
        // formula is equation -> hold true
        // formula cell -> cell object --> name add
        setParentCHArray(currentFormula, address);
        updateChildren(cellObject);
    }
})

function evaluateFormula(formula){
    // ( A1 + A2 )
    // split
    // [(,A1,+,A2,)]
    // a -> z -- columns have
     let formulaTokens = formula.split(" ");
     for(let i=0;i<formulaTokens.length;i++){
        let ascii = formulaTokens[i].charCodeAt(0);
        if(ascii >= 65 && ascii <= 90){
            let {rid, cid} = getRIDCICfromAddress(formulaTokens[i]);
            let value = sheetDB[rid][cid].value;
            if(value == ""){
                value=0;
            }
            formulaTokens[i] = value;
        }
     }
     // [(,10,+,20,)]
     let evaluatedFormula = formulaTokens.join(" ");
     // ( 10 + 20 )
     return eval(evaluatedFormula);
}

function setCell(value, formula){
    // It will take a default cell
    let uicellElem = findUICellElement();
    uicellElem.innerText = value;
    // DB Update
    let {rid, cid} = getRIDCICfromAddress(addressInput.value);
    sheetDB[rid][cid].value = value;
    sheetDB[rid][cid].formula = formula;
}

// DOM element reference that is inside address bar
function findUICellElement() {
    let address = addressInput.value;
    let riciObj = getRIDCICfromAddress(address);
    let rid = riciObj.rid;
    let cid = riciObj.cid;
    let uiCellElement = document.querySelector(`.cell[rid="${rid}"][cid="${cid}"]`);
    return uiCellElement;
}

// Address (string) -> rid / cid
function getRIDCICfromAddress(address) {
    let cid = Number(address.charCodeAt(0)) - 65;
    let rid = Number(address.slice(1)) - 1;
    return { "rid": rid, "cid": cid};
}

// register yourself as the children of the parent(cells that are appearing in the formula) 
function setParentCHArray(formula, chAddress){
    let formulaTokens = formula.split(" ");
    for(let i=0;i<formulaTokens.length;i++){
       let ascii = formulaTokens[i].charCodeAt(0);
       if(ascii >= 65 && ascii <= 90){
           let {rid, cid} = getRIDCICfromAddress(formulaTokens[i]);
           let parentObj = sheetDB[rid][cid];
           parentObj.children.push(chAddress);
       }
    }
}

function updateChildren(cellObject) {
    let children = cellObject.children;
    for(let i=0;i<children.length;i++){
        // children name
        let chAddress = children[i];
        let {rid, cid} = getRIDCICfromAddress(chAddress);
        // 2d Array
        let childObj =  sheetDB[rid][cid];
        // get formula of children
        let chFormula = childObj.formula;

        let newValue = evaluateFormula(chFormula);
        SetChildrenCell(newValue, chFormula, rid, cid);
        // to update its children (recursive call)
        updateChildren(childObj);
    }
}

function SetChildrenCell(value, formula, rid, cid){
    let uiCellElement = document.querySelector(`.cell[rid="${rid}"][cid="${cid}"]`);
    uiCellElement.innerText = value;
    sheetDB[rid][cid].value = value;
    //sheetDB[rid][cid].formula = formula;
}

function removeFormula(cellObject,myName){
    // formula -> parent -> children array remove yourself
    let formula = cellObject.formula;
    let formulaTokens = formula.split(" ");
    for(let i=0;i<formulaTokens.length;i++){
       let ascii = formulaTokens[i].charCodeAt(0);
       if(ascii >= 65 && ascii <= 90){
           let {rid, cid} = getRIDCICfromAddress(formulaTokens[i]);
           let parentObj = sheetDB[rid][cid];
           let idx = parentObj.children.indexOf(myName);
           parentObj.children.splice(idx,1);
       }
    }
    cellObject.formula = "";
}