/*--
    PROGRAM: Mine Sweeper
    AUTHOR: lc

    Edit History:
    2021-03-22  lc      Created from scratch

    No warrenty.

    Introduction:
    
    This is a simple minesweeper program that was written as
    a challenge to test my Javascript code. It wasn't designed
    to look pretty, just work.

--*/

console.log('Starting Minesweeper');
const cellSize = 20;            // Height and width of a cell
var numberOfCells = 16;         // Default: 10x10 matrix for the sea
var seaPixelSize = cellSize * numberOfCells;

var row_style = `width: ${seaPixelSize}px; display: grid; grid-template-columns: repeat(${numberOfCells}, ${cellSize}px);`;
var seaStyle = '';
var seaMap = [];
var mine_value_table = [];

var debug = false;          // Debug logic on/off

var surrounding_cell_offsets =             
[
    [-1,-1],    [-1,0],     [-1,1],
    [0,-1],                 [0, 1],
    [1,-1],     [1, 0],     [1, 1]
];

// Game States:
var number_of_mines = 15;
var mines_found = 0;
var game_over = false;
var score_div = null;
var safe_square_count = numberOfCells*numberOfCells - number_of_mines;

const loose = false;
const win = true;
const WIN_STATEMENT = 'Game Over: You Won';
const LOOSE_STATEMENT = 'Game Over: You Lost';

// CSS IDs For the Webpage
const CSS_UNTESTED = 'untested';
const CSS_MINE = 'mine';
const CSS_FLAG = 'flag';
const CSS_DETECTED = 'detected';
const CSS_SHOW_MINE = 'show_mine';  // Debugging: Show mines in pink

// Webpage Dvision IDs:
const ID_SEA = 'sea';
const ID_STATE = 'state';
const ID_SCORE = 'score';

const DIV_ELEMENT = 'div';
const ELEMENT_STYLE = 'style';

const EVENT_CONTEXTMENU = 'contextmenu';
const EVENT_MOUSEDOWN = 'mousedown';

window.onload=function () 
{ 
    var sea = document.getElementById(ID_SEA); // Find the sea
    var matrix = document.createElement(DIV_ELEMENT);
    let cell;

    score_div = document.getElementById(ID_SCORE);
    score_div.innerText = safe_square_count;

    // Create all of the cells that make up the sea
    for(let y=0; y< numberOfCells; y++)
    {
        seaMap[y] = new Array(numberOfCells);

        row = document.createElement(DIV_ELEMENT);
        row.setAttribute(ELEMENT_STYLE, row_style);
        for(let x=0; x< numberOfCells; x++)
        {
            let cell = create_square(x,y)
            row.appendChild(cell);
            seaMap[y][x] = cell;
        }
        matrix.appendChild(row)
    }

    sea.appendChild(matrix);

    // Generate the mines:
    for(let mine_id=0; mine_id < number_of_mines;)
    {
        let r = Math.trunc(Math.random() * numberOfCells);
        let c = Math.trunc(Math.random() * numberOfCells);

        if(seaMap[r][c].mine === false)
        {
            seaMap[r][c].mine = true;
          if(debug) { seaMap[r][c].id = CSS_SHOW_MINE; }
            mine_id++;
            
            surrounding_cell_offsets.forEach((offset, index)=>
            {
                let y_up = offset[0]+r;
                let x_up = offset[1]+c;

                if((y_up<0) ||
                    (y_up===numberOfCells) ||
                    (x_up<0)
                    ||(x_up===numberOfCells)) { return; }

                if(seaMap[y_up][x_up].mine) { return; }
                seaMap[y_up][x_up].surrounding_mines++;
                if(debug) { seaMap[y_up][x_up].innerText = seaMap[y_up][x_up].surrounding_mines; }
            });
        }
    }
}

function show_board()
{
    for(let r=0; r<numberOfCells; r++)
    {
        for(let c=0; c<numberOfCells; c++)
        {
            let cell = seaMap[r][c];
            if(cell.mine) { cell.id = CSS_MINE; } 
            else { cell.id = CSS_DETECTED; } 

            cell.removeEventListener(EVENT_MOUSEDOWN, clicked);
        }
    }
}

function gave_over_logic(win)
{
    show_board();
    game_over = true;
    if(win)
    {
        let game_state = document.getElementById(ID_STATE).innerText = WIN_STATEMENT;
    }
    else
    {
        let game_state = document.getElementById(ID_STATE).innerText = LOOSE_STATEMENT ; 
    }
}
/*---
    Function: Create_square()
    =========================
    This is call at startup to create each of the 'cells' in
    minesweeper. The state of the cell is set to a default:

    1. It doesn't contain a mine
    2. It's not be 'detected' - i.e.: Not clicked on or been
                found to be empty by the 'path_find' function.
    3. Flagged as a possible mine.

    The 'mine value' is used to work out if the cell should 
    contain a mine latter on.
---*/
function create_square(x, y)
{
    cell = document.createElement(DIV_ELEMENT);
    cell.id = CSS_UNTESTED;
    cell.addEventListener(EVENT_CONTEXTMENU, noContext);        // Shut off the context menu (right mouse)
    cell.addEventListener(EVENT_MOUSEDOWN, clicked);

    cell.value_x = x;
    cell.value_y = y;
    cell.mine_value = Math.random();

    cell.mine = false;          // Does the square contain a mine
    cell.detected = false;      // Has the square been tested?
    cell.flagged = false;       // Has the square been flagged as a possible mine?

    cell.surrounding_mines = 0;
    mine_value_table.push(cell.mine_value);
    
    return cell;
}

/*--
    Function: path_find()
    =====================
    When the user clicks an empty cell, the code works out
    which associated cells need to marked as 'empty' 
    (path clearance). The code uses a recurisive algorthim 
    to map out connected cells. If it find a cell that's 
    already cleared (detected) or all mines are found, then
    it returns up the recursive tree.
--*/
function path_find( cell )
{
    // Return conditions
    if( game_over ) { return; }
    if( cell.detected ) { return; }
    
    let c = cell.value_x;
    let r = cell.value_y;

    cell.detected = true;
    cell.id = CSS_DETECTED;

    cell.removeEventListener(EVENT_MOUSEDOWN, clicked);
    safe_square_count--;
    score_div.innerText = safe_square_count;

    if(safe_square_count===0) { gave_over_logic(win); return; }

    if(cell.surrounding_mines !== 0) { cell.innerText = cell.surrounding_mines; return; }

    // Look at the surrounding cells and find out if they can be 
    // cleared. This is where recursion kicks in.
    surrounding_cell_offsets.forEach((offset,i)=>
    {
        let y_up = offset[0]+r;
        let x_up = offset[1]+c;

        if((y_up<0) ||
            (y_up===numberOfCells) ||
            (x_up<0)
            ||(x_up===numberOfCells)) { return; }

        path_find(seaMap[y_up][x_up]);
    });
}

function clicked(e)
{
    switch(e.buttons)
    {
    case 1:
    {
        if(this.mine) { gave_over_logic(loose); return; }
        path_find(this);
        break;
    }
    case 2:
    {
     // Default colour
        let colour = null;
            
        if(this.flagged) 
        {       
            this.id = CSS_UNTESTED; 
            this.flagged = false;
        }
        else
        {
            this.id = CSS_FLAG;
            this.flagged = true;
        }
        break;
    }
    default:
        console.log('Something went wrong' + e.buttons);
        break;
    }
}

function noContext(e)
{
    return e.preventDefault();
}
