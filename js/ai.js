"use strict";

PawnPosition.clone = function(pawnPosition) {
    return new PawnPosition(pawnPosition.row, pawnPosition.col);
};

Pawn.clone = function(pawn) {
    const _clone = new Pawn(pawn.index, pawn.isHumanPlayer, true);
    _clone.index = pawn.index;
    _clone.isHumanPlayer = pawn.isHumanPlayer;
    _clone.position = PawnPosition.clone(pawn.position);
    _clone.goalRow = pawn.goalRow;
    _clone.numberOfLeftWalls = pawn.numberOfLeftWalls;
    return _clone;
};

Board.clone = function(board) {
    const _clone = new Board(true, true);
    _clone.pawns = [Pawn.clone(board.pawns[0]), Pawn.clone(board.pawns[1])];
    _clone.walls = {horizontal: create2DArrayClonedFrom(board.walls.horizontal), vertical: create2DArrayClonedFrom(board.walls.vertical)};
    return _clone;
};

Game.clone = function(game) {
    const _clone = new Game(true, true);
    _clone.board = Board.clone(game.board);
    if (game.winner === null) {
        _clone.winner = null;
    } else {
        _clone.winner = _clone.board.pawns[game.winner.index];
    }
    _clone._turn = game._turn;
    _clone.validNextWalls = {
        horizontal: create2DArrayClonedFrom(game.validNextWalls.horizontal),
        vertical: create2DArrayClonedFrom(game.validNextWalls.vertical)
    };
    _clone._probableNextWalls = {
        horizontal: create2DArrayClonedFrom(game._probableNextWalls.horizontal),
        vertical: create2DArrayClonedFrom(game._probableNextWalls.vertical)
    };
    _clone._probableValidNextWalls = null;
    _clone._probableValidNextWallsUpdated = false;
    _clone.openWays = {
        upDown: create2DArrayClonedFrom(game.openWays.upDown),
        leftRight: create2DArrayClonedFrom(game.openWays.leftRight)
    };
    _clone._validNextPositions = create2DArrayClonedFrom(game._validNextPositions);
    _clone._validNextPositionsUpdated = game._validNextPositionsUpdated;
    return _clone;
};

PawnPosition.prototype.getDisplacementPawnMoveTupleFrom = function(position) {
    return [this.row - position.row, this.col - position.col];
}

Game.prototype.getArrOfValidNextPositionTuples = function() {
    return indicesOfValueIn2DArray(this.validNextPositions, true);
}

Game.prototype.getArrOfValidNoBlockNextHorizontalWallPositions = function() {
    const nextHorizontals = indicesOfValueIn2DArray(this.validNextWalls.horizontal, true);
    const noBlockNextHorizontals = [];
    for (let i = 0; i < nextHorizontals.length; i++) {
        if (this.testIfExistPathsToGoalLinesAfterPlaceHorizontalWall(nextHorizontals[i][0], nextHorizontals[i][1])) {   
            noBlockNextHorizontals.push(nextHorizontals[i]);
        }
    }
    return noBlockNextHorizontals;
};

Game.prototype.getArrOfValidNoBlockNextVerticalWallPositions = function() {
    const nextVerticals = indicesOfValueIn2DArray(this.validNextWalls.vertical, true);
    const noBlockNextVerticals = [];
    for (let i = 0; i < nextVerticals.length; i++) {
        if (this.testIfExistPathsToGoalLinesAfterPlaceVerticalWall(nextVerticals[i][0], nextVerticals[i][1])) {
            noBlockNextVerticals.push(nextVerticals[i]);
        }
    }
    return noBlockNextVerticals;
};

Game.prototype.getArrOfProbableValidNoBlockNextHorizontalWallPositions = function() {
    const nextHorizontals = indicesOfValueIn2DArray(this.probableValidNextWalls.horizontal, true);
    const noBlockNextHorizontals = [];
    for (let i = 0; i < nextHorizontals.length; i++) {
        if (this.testIfExistPathsToGoalLinesAfterPlaceHorizontalWall(nextHorizontals[i][0], nextHorizontals[i][1])) {   
            noBlockNextHorizontals.push(nextHorizontals[i]);
        }
    }
    return noBlockNextHorizontals;
};

Game.prototype.getArrOfProbableValidNoBlockNextVerticalWallPositions = function() {
    const nextVerticals = indicesOfValueIn2DArray(this.probableValidNextWalls.vertical, true);
    const noBlockNextVerticals = [];
    for (let i = 0; i < nextVerticals.length; i++) {
        if (this.testIfExistPathsToGoalLinesAfterPlaceVerticalWall(nextVerticals[i][0], nextVerticals[i][1])) {
            noBlockNextVerticals.push(nextVerticals[i]);
        }
    }
    return noBlockNextVerticals;
};

Game.prototype.getArrOfValidNoBlockNextWallsDisturbPathOf = function(pawn) {
    const validNextWallsInterupt = AI.getValidNextWallsDisturbPathOf(pawn, this);
    const nextHorizontals = indicesOfValueIn2DArray(validNextWallsInterupt.horizontal, true);
    const noBlockNextHorizontals = [];
    for (let i = 0; i < nextHorizontals.length; i++) {
        if (this.testIfExistPathsToGoalLinesAfterPlaceHorizontalWall(nextHorizontals[i][0], nextHorizontals[i][1])) {   
            noBlockNextHorizontals.push(nextHorizontals[i]);
        }
    }
    const nextVerticals = indicesOfValueIn2DArray(validNextWallsInterupt.vertical, true);
    const noBlockNextVerticals = [];
    for (let i = 0; i < nextVerticals.length; i++) {
        if (this.testIfExistPathsToGoalLinesAfterPlaceVerticalWall(nextVerticals[i][0], nextVerticals[i][1])) {
            noBlockNextVerticals.push(nextVerticals[i]);
        }
    }
    return {arrOfHorizontal: noBlockNextHorizontals, arrOfVertical: noBlockNextVerticals};
}
class MNode {
    constructor(move, parent, uctConst) {
        this.move = move;
        this.parent = parent;
        this.uctConst = uctConst;
        this.numWins = 0;
        this.numSims = 0;
        this.children = [];
        this.isTerminal = false;
    }

    get isLeaf() {
        return this.children.length === 0;
    }

    get isNew() {
        return this.numSims === 0;
    }
    get uct() {
        if (this.parent === null || this.parent.numSims === 0) {
            throw "UCT_ERROR"
        }
        if (this.numSims === 0) {
            return Infinity;
        }
        return (this.numWins / this.numSims) + Math.sqrt((this.uctConst * Math.log(this.parent.numSims)) / this.numSims);
    }

    get winRate() {
        return this.numWins / this.numSims;
    }

    get maxUCTChild() {
        let maxUCTIndices;
        let maxUCT = -Infinity;
        for (let i = 0; i < this.children.length; i++) {
            const uct = this.children[i].uct;
            if (uct > maxUCT) {
                maxUCT = uct;
                maxUCTIndices = [i];  
            } else if (uct === maxUCT) {
                maxUCTIndices.push(i);
            }
        }
        const maxUCTIndex = randomChoice(maxUCTIndices);
        return this.children[maxUCTIndex];
    }

    get maxWinRateChild() {
        let maxWinRateIndex;
        let maxWinRate = -Infinity;
        for (let i = 0; i < this.children.length; i++) {
            if (this.children[i].winRate > maxWinRate) {
                maxWinRate = this.children[i].winRate;
                maxWinRateIndex = i;  
            }
        }
        return this.children[maxWinRateIndex];
    }

    get maxSimsChild() {
        let maxSimsIndex;
        let maxSims = -Infinity;
        for (let i = 0; i < this.children.length; i++) {
            if (this.children[i].numSims > maxSims) {
                maxSims = this.children[i].numSims;
                maxSimsIndex = i;  
            }
        }
        return this.children[maxSimsIndex];
    }

    addChild(childNode) {
        this.children.push(childNode);
    }

    printChildren() {
        for (let i = 0; i < this.children.length; i++) {
            console.log(`children[${i}].move: ${this.children[i].move}`);
        }
    }
}

class MonteCarloTreeSearch {
    constructor(game, uctConst) {
        this.game = game;
        this.uctConst = uctConst;
        this.root = new MNode(null, null, this.uctConst);
        this.totalNumOfSimulations = 0;
    }

    static maxDepth(node) {
        let max = 0;
        for (let i = 0; i < node.children.length; i++) {
            const d = this.maxDepth(node.children[i]) + 1;
            if (d > max) {
                max = d;
            }
        }
        return max;
    }

    search(numOfSimulations) {
        const uctConst = this.uctConst;

        let currentNode = this.root;   
        const limitOfTotalNumOfSimulations = this.totalNumOfSimulations + numOfSimulations;
        while (this.totalNumOfSimulations < limitOfTotalNumOfSimulations) {         
            if (currentNode.isTerminal) {
                this.rollout(currentNode);
                currentNode = this.root;
            } else if (currentNode.isLeaf) {
                if (currentNode.isNew) {
                    this.rollout(currentNode);
                    currentNode = this.root;
                } else {
                    const simulationGame = this.getSimulationGameAtNode(currentNode);
                    let move, childNode;
                    if (simulationGame.pawnOfNotTurn.numberOfLeftWalls > 0) {
                        const nextPositionTuples = simulationGame.getArrOfValidNextPositionTuples();
                        for (let i = 0; i < nextPositionTuples.length; i++) {
                            move = [nextPositionTuples[i], null, null];
                            childNode = new MNode(move, currentNode, uctConst); 
                            currentNode.addChild(childNode);
                        }
                        if (simulationGame.pawnOfTurn.numberOfLeftWalls > 0) {
                            const noBlockNextHorizontals = simulationGame.getArrOfProbableValidNoBlockNextHorizontalWallPositions();
                            for (let i = 0; i < noBlockNextHorizontals.length; i++) { 
                                move = [null, noBlockNextHorizontals[i], null];
                                childNode = new MNode(move, currentNode, uctConst); 
                                currentNode.addChild(childNode);
                            }
                            const noBlockNextVerticals = simulationGame.getArrOfProbableValidNoBlockNextVerticalWallPositions();
                            for (let i = 0; i < noBlockNextVerticals.length; i++) {
                                move = [null, null, noBlockNextVerticals[i]];
                                childNode = new MNode(move, currentNode, uctConst); 
                                currentNode.addChild(childNode);
                            }
                        }
                    } else {
                        const nextPositions = AI.chooseShortestPathNextPawnPositionsThoroughly(simulationGame);
                        for (let i = 0; i < nextPositions.length; i++) {
                            const nextPosition = nextPositions[i];
                            move = [[nextPosition.row, nextPosition.col], null, null];
                            childNode = new MNode(move, currentNode, uctConst);
                            currentNode.addChild(childNode);
                        }
                        if (simulationGame.pawnOfTurn.numberOfLeftWalls > 0) {
                            const noBlockNextWallsInterupt =
                            simulationGame.getArrOfValidNoBlockNextWallsDisturbPathOf(simulationGame.pawnOfNotTurn);
                            const noBlockNextHorizontalsInterupt = noBlockNextWallsInterupt.arrOfHorizontal;
                            for (let i = 0; i < noBlockNextHorizontalsInterupt.length; i++) {
                                move = [null, noBlockNextHorizontalsInterupt[i], null];
                                childNode = new MNode(move, currentNode, uctConst);
                                currentNode.addChild(childNode);
                            }
                            const noBlockNextVerticalsInterupt = noBlockNextWallsInterupt.arrOfVertical;
                            for (let i = 0; i < noBlockNextVerticalsInterupt.length; i++) {
                                move = [null, null, noBlockNextVerticalsInterupt[i]];
                                childNode = new MNode(move, currentNode, uctConst);
                                currentNode.addChild(childNode);
                            }
                        }
                    }
                    this.rollout(randomChoice(currentNode.children));
                    currentNode = this.root;
                }
            } else {
                currentNode = currentNode.maxUCTChild;
            }
        }
    }

    selectBestMove() {
        const best = this.root.maxSimsChild;
        return {move: best.move, winRate: best.winRate};
    }
    
    getSimulationGameAtNode(node) {
        const simulationGame = Game.clone(this.game);
        const stack = [];

        let ancestor = node;
        while(ancestor.parent !== null) {
            stack.push(ancestor.move);
            ancestor = ancestor.parent;
        }
        
        while (stack.length > 0) {
            const move = stack.pop();
            simulationGame.doMove(move);
        }
        return simulationGame;
    }

    rollout(node) {
        this.totalNumOfSimulations++;
        const simulationGame = this.getSimulationGameAtNode(node);
        const nodePawnIndex = simulationGame.pawnIndexOfNotTurn;
        if (simulationGame.winner !== null) {
            node.isTerminal = true;
        }
        const cacheForPawns = [
            {
                updated: false,
                prev: null,
                next: null,
                distanceToGoal: null
            },
            {
                updated: false,
                prev: null,
                next: null,
                distanceToGoal: null
            }
        ];
        let pawnMoveFlag = false;
        
        while (simulationGame.winner === null) {
            if (!cacheForPawns[0].updated) {
                const t = AI.get2DArrayPrevAndNextAndDistanceToGoalFor(simulationGame.pawn0, simulationGame);
                cacheForPawns[0].prev = t[0];
                cacheForPawns[0].next = t[1];
                cacheForPawns[0].distanceToGoal = t[2];
                cacheForPawns[0].updated = true;
            }
            if (!cacheForPawns[1].updated) {
                const t = AI.get2DArrayPrevAndNextAndDistanceToGoalFor(simulationGame.pawn1, simulationGame);
                cacheForPawns[1].prev = t[0];
                cacheForPawns[1].next = t[1];
                cacheForPawns[1].distanceToGoal = t[2];
                cacheForPawns[1].updated = true;
            }

            const pawnOfTurn = simulationGame.pawnOfTurn; 
            const pawnIndexOfTurn = simulationGame.pawnIndexOfTurn;
            if (Math.random() < 0.7) {
                pawnMoveFlag = false;
                const next = cacheForPawns[pawnIndexOfTurn].next;
                const currentPosition = pawnOfTurn.position;
                let nextPosition = next[currentPosition.row][currentPosition.col];
                if (nextPosition === null) {
                    console.log("really?? already in goal position");
                    throw "already in goal Position...."
                }             
                if (AI.arePawnsAdjacent(simulationGame)) {
                    const nextNextPosition = next[nextPosition.row][nextPosition.col];
                    if (nextNextPosition !== null
                        && simulationGame.validNextPositions[nextNextPosition.row][nextNextPosition.col] === true) {
                        nextPosition = nextNextPosition;
                        cacheForPawns[pawnIndexOfTurn].distanceToGoal -= 2;
                    } else {
                        const nextPositions = AI.chooseShortestPathNextPawnPositionsThoroughly(simulationGame);
                        const _nextPosition = randomChoice(nextPositions);
                        if (_nextPosition.equals(nextPosition)) {
                            cacheForPawns[pawnIndexOfTurn].distanceToGoal -= 1;
                        } else {
                            nextPosition = _nextPosition;
                            cacheForPawns[pawnIndexOfTurn].updated = false;
                        }
                    }
                } else {
                    cacheForPawns[pawnIndexOfTurn].distanceToGoal -= 1;
                }
                simulationGame.movePawn(nextPosition.row, nextPosition.col);
            } else if (!pawnMoveFlag && pawnOfTurn.numberOfLeftWalls > 0) {
                const nextMove = AI.chooseProbableNextWall(simulationGame);
                if (nextMove !== null) {
                    simulationGame.doMove(nextMove);
                    cacheForPawns[0].updated = false;
                    cacheForPawns[1].updated = false;
                } else {
                    console.log("No probable walls possible")
                    pawnMoveFlag = true;
                }
            } else {
                pawnMoveFlag = false;
                const prev = cacheForPawns[pawnIndexOfTurn].prev;
                const currentPosition = pawnOfTurn.position;
                let prevPosition = prev[currentPosition.row][currentPosition.col];
                if (prevPosition === null || !simulationGame.validNextPositions[prevPosition.row][prevPosition.col]) {
                    const prevPositions = AI.chooseLongestPathNextPawnPositionsThoroughly(simulationGame);
                    prevPosition = randomChoice(prevPositions);
                    cacheForPawns[pawnIndexOfTurn].updated = false;
                } else {
                    cacheForPawns[pawnIndexOfTurn].distanceToGoal += 1;
                }
                simulationGame.movePawn(prevPosition.row, prevPosition.col);
            }
        }

        let ancestor = node;
        let ancestorPawnIndex = nodePawnIndex;
        while(ancestor !== null) {
            ancestor.numSims++;
            if (simulationGame.winner.index === ancestorPawnIndex) {
                ancestor.numWins += 1;
            }
            ancestor = ancestor.parent;
            ancestorPawnIndex = (ancestorPawnIndex + 1) % 2;
        }
    }
}

class AI {
    constructor(numOfMCTSSimulations, uctConst, aiDevelopMode = false, forWorker = false) {
        this.numOfMCTSSimulations = numOfMCTSSimulations
        this.uctConst = uctConst;
        this.aiDevelopMode = aiDevelopMode;
        this.forWorker = forWorker;
    }

    chooseNextMove(game) {
        const d0 = new Date();
        
        if (game.turn < 2) {
            const nextPosition = AI.chooseShortestPathNextPawnPosition(game);
            const pawnMoveTuple = nextPosition.getDisplacementPawnMoveTupleFrom(game.pawnOfTurn.position);
            if (pawnMoveTuple[1] === 0) {
                if (this.forWorker) {
                    postMessage(1);
                }
                return [[nextPosition.row, nextPosition.col], null, null];
            }
        }

        const mcts = new MonteCarloTreeSearch(game, this.uctConst);
        
        if (this.forWorker) {
            const nSearch = 50;
            const nBatch = Math.ceil(this.numOfMCTSSimulations / nSearch);
            postMessage(0);
            for (let i = 0; i < nSearch; i++) {
                mcts.search(nBatch);
                postMessage((i+1)/nSearch);
            }
        } else {
            mcts.search(this.numOfMCTSSimulations);
        }

        const best = mcts.selectBestMove();
        let bestMove = best.move;
        const winRate = best.winRate;
        
        if (((game.turn < 6 && game.pawnOfTurn.position.col === 4) || winRate < 0.1) && bestMove[0] !== null) {
            let rightMove = false;
            const nextPositions = AI.chooseShortestPathNextPawnPositionsThoroughly(game);
            for (const nextPosition of nextPositions) {
                if (bestMove[0][0] === nextPosition.row && bestMove[0][1] === nextPosition.col) {
                    rightMove = true;
                    break;
                }
            }
            if (!rightMove) {
                console.log("original move:", bestMove);
                const nextPosition = randomChoice(nextPositions);
                bestMove = [[nextPosition.row, nextPosition.col], null, null];
            }
        }
        if (game.turn < 5 && game.pawnOfNotTurn.position.col === 4 && game.pawnOfNotTurn.position.row === 6 && Math.random() < 0.5) {
            const bestMoves = [
                [null, [5, 3], null], 
                [null, [5, 4], null],
                [null, null, [4, 3]],
                [null, null, [4, 4]]
            ];
            console.log("original move:", bestMove);
            bestMove = randomChoice(bestMoves); 
        }
        if (game.turn < 5 && game.pawnOfNotTurn.position.col === 4 && game.pawnOfNotTurn.position.row === 2 && Math.random() < 0.5) {
            const bestMoves = [
                [null, [2, 3], null], 
                [null, [2, 4], null],
                [null, null, [3, 3]],
                [null, null, [3, 4]]
            ];
            console.log("original move:", bestMove);
            bestMove = randomChoice(bestMoves); 
        }

        const d1 = new Date();
        const uctConst = mcts.root.children[0].uctConst;
        console.log(`time taken by AI for ${(this.numOfMCTSSimulations)} rollouts, c=${(uctConst)}: ${(d1.getTime() - d0.getTime())/1000} sec`);

        if (this.aiDevelopMode) {
            console.log("descend maxWinRateChild")
            let node = mcts.root
            let i = 1;
            while(node.children.length > 0) {
                node = node.maxWinRateChild;
                console.log(i, node.move, node.winRate, node.numWins, node.numSims);
                i++;
            }
            console.log("descend maxSimsChild")
            node = mcts.root
            i = 1;
            while(node.children.length > 0) {
                node = node.maxSimsChild;
                console.log(i, node.move, node.winRate, node.numWins, node.numSims);
                i++;
            }
            console.log(`maxDepth: ${MonteCarloTreeSearch.maxDepth(mcts.root)}`);
            console.log(`estimated maxWinRateChild win rate: ${mcts.root.maxWinRateChild.winRate}`);
            console.log(`estimated maxSimsChild win rate: ${winRate}`);
        } else {
            console.log(`estimated AI win rate: ${winRate}`);
        }
        return bestMove;
    }

    static chooseShortestPathNextPawnPositionsThoroughly(game) {
        const valids = indicesOfValueIn2DArray(game.validNextPositions, true);
        const distances = [];
        for (let i = 0; i < valids.length; i++) {
            const clonedGame = Game.clone(game);
            clonedGame.movePawn(valids[i][0], valids[i][1]);
            const distance = AI.getShortestDistanceToGoalFor(clonedGame.pawnOfNotTurn, clonedGame);
            distances.push(distance);
        }
        const nextPositions = [];
        for (const index of (indicesOfMin(distances))) {
            nextPositions.push(new PawnPosition(valids[index][0], valids[index][1]));
        }
        return nextPositions;
    }

    static chooseLongestPathNextPawnPositionsThoroughly(game) {
        const valids = indicesOfValueIn2DArray(game.validNextPositions, true);
        const distances = [];
        for (let i = 0; i < valids.length; i++) {
            const clonedGame = Game.clone(game);
            clonedGame.movePawn(valids[i][0], valids[i][1]);
            const distance = AI.getShortestDistanceToGoalFor(clonedGame.pawnOfNotTurn, clonedGame);
            distances.push(distance);
        }
        const nextPositions = [];
        for (const index of (indicesOfMax(distances))) {
            nextPositions.push(new PawnPosition(valids[index][0], valids[index][1]));
        }
        return nextPositions;
    }

    static get2DArrayPrevAndNextAndDistanceToGoalFor(pawn, game) {
        const t = this.getRandomShortestPathToGoal(pawn, game);
        const dist = t[0];
        const prev = t[1];
        const goalPosition = t[2];
        const distanceToGoal = dist[goalPosition.row][goalPosition.col];
        const next = AI.getNextByReversingPrev(prev, goalPosition);
        return [prev, next, distanceToGoal];
    }

    static chooseShortestPathNextPawnPosition(game) {
        let nextPosition = null;
        if (AI.arePawnsAdjacent(game)) {
            const nextPositions = this.chooseShortestPathNextPawnPositionsThoroughly(game);
            nextPosition = randomChoice(nextPositions);
        } else { 
            const next = AI.get2DArrayPrevAndNextAndDistanceToGoalFor(game.pawnOfTurn, game)[1];
            const currentPosition = game.pawnOfTurn.position
            nextPosition = next[currentPosition.row][currentPosition.col]; 

            if (nextPosition === null) {
                console.log("really?? already in goal position");
            }
        }
        return nextPosition;
    }

    static chooseNextPawnPositionRandomly(game) {
        const nextPositionTuples = game.getArrOfValidNextPositionTuples();
        const nextPositionTuple = randomChoice(nextPositionTuples);
        return new PawnPosition(nextPositionTuple[0], nextPositionTuple[1]);
    }
    
    static chooseNextWallRandomly(game) {
        const nextMoves = [];
        const nextHorizontals = indicesOfValueIn2DArray(game.validNextWalls.horizontal, true);
        for (let i = 0; i < nextHorizontals.length; i++) { 
            nextMoves.push([null, nextHorizontals[i], null]);
        }
        const nextVerticals = indicesOfValueIn2DArray(game.validNextWalls.vertical, true);
        for (let i = 0; i < nextVerticals.length; i++) {
            nextMoves.push([null, null, nextVerticals[i]]);
        }
        let nextMoveIndex = randomIndex(nextMoves);
        while(!game.isPossibleNextMove(nextMoves[nextMoveIndex])) {
            nextMoves.splice(nextMoveIndex, 1);
            if (nextMoves.length === 0) {
                console.log("Is it really possible???")
                return null;
            }
            nextMoveIndex = randomIndex(nextMoves);
        }
        return nextMoves[nextMoveIndex];
    }

    static chooseProbableNextWall(game) {
        const nextMoves = [];
        const nextHorizontals = indicesOfValueIn2DArray(game.probableValidNextWalls.horizontal, true);
        for (let i = 0; i < nextHorizontals.length; i++) { 
            nextMoves.push([null, nextHorizontals[i], null]);
        }
        const nextVerticals = indicesOfValueIn2DArray(game.probableValidNextWalls.vertical, true);
        for (let i = 0; i < nextVerticals.length; i++) {
            nextMoves.push([null, null, nextVerticals[i]]);
        }
        if (nextMoves.length === 0) {
            return null;
        }
        let nextMoveIndex = randomIndex(nextMoves);
        while(!game.isPossibleNextMove(nextMoves[nextMoveIndex])) {
            nextMoves.splice(nextMoveIndex, 1);
            if (nextMoves.length === 0) {
                console.log("Is it really possible???")
                return null;
            }
            nextMoveIndex = randomIndex(nextMoves);
        }
        return nextMoves[nextMoveIndex];
    }

    static arePawnsAdjacent(game) {
        return ((game.pawnOfNotTurn.position.row === game.pawnOfTurn.position.row
                && Math.abs(game.pawnOfNotTurn.position.col - game.pawnOfTurn.position.col) === 1)
                || (game.pawnOfNotTurn.position.col === game.pawnOfTurn.position.col
                    && Math.abs(game.pawnOfNotTurn.position.row - game.pawnOfTurn.position.row) === 1))
    }

    static getRandomShortestPathToGoal2(pawn, game) {
        const goalRow = pawn.goalRow;
        const heuristicCostEstimate = position => Math.abs(goalRow - position.row);
        const gScore = create2DArrayInitializedTo(9, 9, Infinity);
        const fScore = create2DArrayInitializedTo(9, 9, Infinity);
        const closedSet = create2DArrayInitializedTo(9, 9, false);
        const openSet = new PriorityQueue((a, b) => fScore[a.row][a.col] < fScore[b.row][b.col]);
        const openSetOnceIncluded = create2DArrayInitializedTo(9, 9, false);
        const prev = create2DArrayInitializedTo(9, 9, null);
        const pawnMoveTuples = shuffle([MOVE_UP, MOVE_RIGHT, MOVE_DOWN, MOVE_LEFT]);
    
        const startPosition = pawn.position;
        gScore[startPosition.row][startPosition.col] = 0;
        fScore[startPosition.row][startPosition.col] = heuristicCostEstimate(startPosition);
    
        openSet.push(startPosition);
        openSetOnceIncluded[startPosition.row][startPosition.col] = true;
    
        while (!openSet.isEmpty()) {
            const currentPosition = openSet.pop();
            if (currentPosition.row === goalRow) {
                const goalPosition = currentPosition
                return [gScore, prev, goalPosition];
            }
            closedSet[currentPosition.row][currentPosition.col] = true;
            for (let i = 0; i < pawnMoveTuples.length; i++) {
                const pawnMoveTuple = pawnMoveTuples[i];
                if (game.isOpenWay(currentPosition.row, currentPosition.col, pawnMoveTuple)) {
                    const neighborPosition = currentPosition.newAddMove(pawnMoveTuple);
                    if (closedSet[neighborPosition.row][neighborPosition.col]) {
                        continue;
                    }
                    const tentativeGScore = gScore[currentPosition.row][currentPosition.col] + 1;
                    if (tentativeGScore >= gScore[neighborPosition.row][neighborPosition.col]) {
                        continue;
                    }
                    prev[neighborPosition.row][neighborPosition.col] = currentPosition;
                    gScore[neighborPosition.row][neighborPosition.col] = tentativeGScore;
                    fScore[neighborPosition.row][neighborPosition.col] = gScore[neighborPosition.row][neighborPosition.col] + heuristicCostEstimate(neighborPosition);
                    if (!openSetOnceIncluded[neighborPosition.row][neighborPosition.col]) {
                        openSet.push(neighborPosition);
                        openSetOnceIncluded[neighborPosition.row][neighborPosition.col] = true;
                    }
                }
            }
        }
        return [gScore, prev, null];
    }
    
    static getRandomShortestPathToGoal(pawn, game) {
        const visited = [
            [false, false, false, false, false, false, false, false, false],
            [false, false, false, false, false, false, false, false, false],
            [false, false, false, false, false, false, false, false, false],
            [false, false, false, false, false, false, false, false, false],
            [false, false, false, false, false, false, false, false, false],
            [false, false, false, false, false, false, false, false, false],
            [false, false, false, false, false, false, false, false, false],
            [false, false, false, false, false, false, false, false, false],
            [false, false, false, false, false, false, false, false, false],
        ];
        const dist = [
            [Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity],
            [Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity],
            [Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity],
            [Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity],
            [Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity],
            [Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity],
            [Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity],
            [Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity],
            [Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity]
        ];
        const prev = [
            [null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null]
        ];
        
        const pawnMoveTuples = shuffle([MOVE_UP, MOVE_RIGHT, MOVE_DOWN, MOVE_LEFT]);
        const queue = [];
        
        visited[pawn.position.row][pawn.position.col] = true;
        dist[pawn.position.row][pawn.position.col] = 0;
        queue.push(pawn.position);
        while (queue.length > 0) {
            let position = queue.shift();
            if (position.row === pawn.goalRow) {
                const goalPosition = position;
                return [dist, prev, goalPosition];
            }
            for (let i = 0; i < pawnMoveTuples.length; i++) {
                if (game.isOpenWay(position.row, position.col, pawnMoveTuples[i])) {
                    const nextPosition = position.newAddMove(pawnMoveTuples[i]);
                    if (!visited[nextPosition.row][nextPosition.col]) {
                        const alt = dist[position.row][position.col] + 1;
                        dist[nextPosition.row][nextPosition.col] = alt;
                        prev[nextPosition.row][nextPosition.col] = position;
                        visited[nextPosition.row][nextPosition.col] = true;
                        queue.push(nextPosition);
                    }
                }
            }
        }
        return [dist, prev, null];
    }

    static getShortestDistanceToGoalFor(pawn, game) {
        const t = AI.getRandomShortestPathToGoal(pawn, game);
        const dist = t[0];
        const goalPosition = t[2];
        if (goalPosition === null) {
            return Infinity;
        }
        return dist[goalPosition.row][goalPosition.col];
    }

    static getShortestDistanceToEveryPosition(pawn, game) {
        const visited = create2DArrayInitializedTo(9, 9, false);
        const dist = create2DArrayInitializedTo(9, 9, Infinity);
    
        const pawnMoveTuples = [MOVE_UP, MOVE_RIGHT, MOVE_DOWN, MOVE_LEFT];
        const queue = [];
        visited[pawn.position.row][pawn.position.col] = true;
        dist[pawn.position.row][pawn.position.col] = 0;
        queue.push(pawn.position)
        while (queue.length > 0) {
            let position = queue.shift();
            for (let i = 0; i < pawnMoveTuples.length; i++) {
                if (game.isOpenWay(position.row, position.col, pawnMoveTuples[i])) {
                    const nextPosition = position.newAddMove(pawnMoveTuples[i]);
                    if (!visited[nextPosition.row][nextPosition.col]) {
                        const alt = dist[position.row][position.col] + 1;
                        dist[nextPosition.row][nextPosition.col] = alt;
                        visited[nextPosition.row][nextPosition.col] = true;
                        queue.push(nextPosition);
                    }
                }
            }
        }
        return dist;
    }

    static getAllShortestPathsToEveryPosition(pawn, game) {
        const searched = create2DArrayInitializedTo(9, 9, false);
        const visited = create2DArrayInitializedTo(9, 9, false);
        const dist = create2DArrayInitializedTo(9, 9, Infinity);
        const multiPrev = create2DArrayInitializedTo(9, 9, null);

        const pawnMoveTuples = [MOVE_UP, MOVE_RIGHT, MOVE_DOWN, MOVE_LEFT];
        const queue = [];
        visited[pawn.position.row][pawn.position.col] = true;
        dist[pawn.position.row][pawn.position.col] = 0;
        queue.push(pawn.position)
        while (queue.length > 0) {
            let position = queue.shift();
            for (let i = 0; i < pawnMoveTuples.length; i++) {
                if (game.isOpenWay(position.row, position.col, pawnMoveTuples[i])) {
                    const nextPosition = position.newAddMove(pawnMoveTuples[i]);
                    if (!searched[nextPosition.row][nextPosition.col]) {
                        const alt = dist[position.row][position.col] + 1;
                        if (alt < dist[nextPosition.row][nextPosition.col]) {
                            dist[nextPosition.row][nextPosition.col] = alt;
                            multiPrev[nextPosition.row][nextPosition.col] = [position];
                        } else if (alt === dist[nextPosition.row][nextPosition.col]) {
                            multiPrev[nextPosition.row][nextPosition.col].push(position);
                        }
                        if (!visited[nextPosition.row][nextPosition.col]) {
                            visited[nextPosition.row][nextPosition.col] = true;
                            queue.push(nextPosition);
                        }
                    }
                }
            }
            searched[position.row][position.col] = true;
        }
        return [dist, multiPrev];
    }

    static getNextByReversingPrev(prev, goalPosition) {
        const next = create2DArrayInitializedTo(9, 9, null);
        let prevPosition;
        let position = goalPosition;
        while(prevPosition = prev[position.row][position.col]) {
            next[prevPosition.row][prevPosition.col] = position;
            position = prevPosition;
        }
        return next;
    }

    static getValidNextWallsDisturbPathOf(pawn, game) {
        const validInterruptHorizontalWalls = create2DArrayInitializedTo(8, 8, false);
        const validInterruptVerticalWalls = create2DArrayInitializedTo(8, 8, false);
        
        const visited = create2DArrayInitializedTo(9, 9, false);
        const t = AI.getAllShortestPathsToEveryPosition(pawn, game);
        const dist = t[0];
        const prev = t[1];
        const goalRow = pawn.goalRow;
        const goalCols = indicesOfMin(dist[goalRow]);
        
        const queue = [];
        for (let i = 0; i < goalCols.length; i++) {
            const goalPosition = new PawnPosition(goalRow, goalCols[i]);
            queue.push(goalPosition);
        }
        
        while (queue.length > 0) {
            let position = queue.shift();
            let prevs = prev[position.row][position.col];
            if (prevs === null) {
                if (queue.length !== 0) {
                    throw "some error occured...."
                }
                continue;
                
            }
            for (let i = 0; i < prevs.length; i++) {
                let prevPosition = prevs[i];
                const pawnMoveTuple = position.getDisplacementPawnMoveTupleFrom(prevPosition);
                if (pawnMoveTuple[0] === -1 && pawnMoveTuple[1] === 0) { 
                    if (prevPosition.col < 8) {
                        validInterruptHorizontalWalls[prevPosition.row-1][prevPosition.col] = true;
                    }
                    if (prevPosition.col > 0) {
                        validInterruptHorizontalWalls[prevPosition.row-1][prevPosition.col-1] = true;
                    }    
                } else if (pawnMoveTuple[0] === 1 && pawnMoveTuple[1] === 0) {
                    if (prevPosition.col < 8) {
                        validInterruptHorizontalWalls[prevPosition.row][prevPosition.col] = true;                   }
                    if (prevPosition.col > 0) {
                        validInterruptHorizontalWalls[prevPosition.row][prevPosition.col-1] = true;
                    }  
                } else if (pawnMoveTuple[0] === 0 && pawnMoveTuple[1] === -1) {
                    if (prevPosition.row < 8) {
                        validInterruptVerticalWalls[prevPosition.row][prevPosition.col-1] = true;
                    }
                    if (prevPosition.row > 0) {
                        validInterruptVerticalWalls[prevPosition.row-1][prevPosition.col-1] = true;
                    }  
                } else if (pawnMoveTuple[0] === 0 && pawnMoveTuple[1] === 1) {
                    if (prevPosition.row < 8) {
                        validInterruptVerticalWalls[prevPosition.row][prevPosition.col] = true;
                    }
                    if (prevPosition.row > 0) {
                        validInterruptVerticalWalls[prevPosition.row-1][prevPosition.col] = true;
                    }  
                }
                                
                if (!visited[prevPosition.row][prevPosition.col]) {
                    visited[prevPosition.row][prevPosition.col] = true;
                    queue.push(prevPosition);
                }
            }
        }

        const wall2DArrays = {horizontal: validInterruptHorizontalWalls, vertical: validInterruptVerticalWalls}
        Game.setWallsBesidePawn(wall2DArrays, pawn);

        wall2DArrays.horizontal = logicalAndBetween2DArray(wall2DArrays.horizontal, game.validNextWalls.horizontal);
        wall2DArrays.vertical = logicalAndBetween2DArray(wall2DArrays.vertical, game.validNextWalls.vertical);
        
        return wall2DArrays;
    }

    static getPathsToGoalFromNext(next, startPosition) {
        const paths = [];
        const addPathToGoalToPaths = function(currentPosition, path) {
            path.push(currentPosition);
            const nexts = next[currentPosition.row][currentPosition.col];
            if (nexts === null) {
                paths.push(path);
                return;
            }
            for (let i = 0; i < nexts.length; i++) {
                addPathToGoalToPaths(nexts[i], [...path]);
            }
        };
        addPathToGoalToPaths(startPosition, []);
        return paths;
    }

}
 
function indicesOfMin(arr) {
    let min = Infinity;
    let indices = [];
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] < min) {
            indices = [i];
            min = arr[i];
        } else if (arr[i] === min) {
            indices.push(i);
        }
    }
    return indices;
}

function indicesOfMax(arr) {
    let max = -Infinity;
    let indices = [];
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] > max) {
            indices = [i];
            max = arr[i];
        } else if (arr[i] === max) {
            indices.push(i);
        }
    }
    return indices;
}

function indicesOfSemiMax(arr) {
    let max = -Infinity;
    let indices = [];
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] !== Infinity && arr[i] !== NaN && arr[i] > max) {
            indices = [i];
            max = arr[i];
        } else if (arr[i] === max) {
            indices.push(i);
        }
    }
    return indices;
}

function randomIndex(arr) {
    return Math.floor(Math.random() * arr.length);
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function indicesOfValueIn2DArray(arr2D, value) {
    let t = [];
    for (let i = 0; i < arr2D.length; i++) {
        for (let j = 0; j < arr2D[0].length; j++) {
            if (arr2D[i][j] === value) {
                t.push([i, j]);
            }
        }
    }
    return t;
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const x = arr[i];
        arr[i] = arr[j];
        arr[j] = x;
    }
    return arr;
}
