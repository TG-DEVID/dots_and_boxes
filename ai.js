// =========================================================
// Dots & Boxes AI Engine
// =========================================================

class DotsAI {
  constructor(game) {
    this.game = game;
  }

  computeMove(difficulty = 'medium') {
    const availableEdges = this.game.getAvailableEdges();
    if (availableEdges.length === 0) return null;

    if (difficulty === 'easy') {
      return this.computeEasyMove(availableEdges);
    } else if (difficulty === 'medium') {
      return this.computeMediumMove(availableEdges);
    } else {
      return this.computeHardMove(availableEdges);
    }
  }

  computeEasyMove(availableEdges) {
    const completingEdge = this.findAnyCompletingEdge(availableEdges);
    if (completingEdge && Math.random() < 0.85) {
      return completingEdge;
    }
    const idx = Math.floor(Math.random() * availableEdges.length);
    return availableEdges[idx];
  }

  computeMediumMove(availableEdges) {
    const completingEdges = this.findAllCompletingEdges(availableEdges);
    if (completingEdges.length > 0) {
      return completingEdges[0];
    }

    const safeEdges = availableEdges.filter(edgeId => {
      const adjacentBoxes = this.game.edgeToBoxes[edgeId] || [];
      return adjacentBoxes.every(boxKey => this.game.boxes[boxKey].count < 2);
    });

    if (safeEdges.length > 0) {
      return safeEdges[Math.floor(Math.random() * safeEdges.length)];
    }

    return this.findLeastDamagingSacrifice(availableEdges);
  }

  computeHardMove(availableEdges) {
    const completingEdges = this.findAllCompletingEdges(availableEdges);

    if (completingEdges.length > 0) {
      const doubleCrossEdge = this.checkDoubleCrossOpportunity(completingEdges, availableEdges);
      if (doubleCrossEdge) {
        return doubleCrossEdge;
      }
      return completingEdges[0];
    }

    const safeEdges = availableEdges.filter(edgeId => {
      const adjacentBoxes = this.game.edgeToBoxes[edgeId] || [];
      return adjacentBoxes.every(boxKey => this.game.boxes[boxKey].count < 2);
    });

    if (safeEdges.length > 0) {
      safeEdges.sort((a, b) => {
        const sumA = (this.game.edgeToBoxes[a] || []).reduce((acc, k) => acc + this.game.boxes[k].count, 0);
        const sumB = (this.game.edgeToBoxes[b] || []).reduce((acc, k) => acc + this.game.boxes[k].count, 0);
        return sumA - sumB;
      });
      return safeEdges[0];
    }

    return this.findOptimalChainSacrifice(availableEdges);
  }

  findAnyCompletingEdge(edges) {
    for (const edgeId of edges) {
      const boxes = this.game.edgeToBoxes[edgeId] || [];
      for (const boxKey of boxes) {
        if (this.game.boxes[boxKey].count === 3) {
          return edgeId;
        }
      }
    }
    return null;
  }

  findAllCompletingEdges(edges) {
    const result = [];
    for (const edgeId of edges) {
      const boxes = this.game.edgeToBoxes[edgeId] || [];
      for (const boxKey of boxes) {
        if (this.game.boxes[boxKey].count === 3) {
          result.push(edgeId);
          break;
        }
      }
    }
    return result;
  }

  findLeastDamagingSacrifice(edges) {
    let bestEdge = edges[0];
    let minGift = 9999;

    for (const edgeId of edges) {
      const giftCount = this.estimateOpponentBoxYield(edgeId);
      if (giftCount < minGift) {
        minGift = giftCount;
        bestEdge = edgeId;
      }
    }
    return bestEdge;
  }

  estimateOpponentBoxYield(edgeId) {
    const boxes = this.game.edgeToBoxes[edgeId] || [];
    let count = 0;
    for (const boxKey of boxes) {
      if (this.game.boxes[boxKey].count === 2) {
        count += 1;
      }
    }
    return count;
  }

  findOptimalChainSacrifice(edges) {
    let bestEdge = edges[0];
    let shortestChain = 999;

    for (const edgeId of edges) {
      const chainLen = this.simulateChainLength(edgeId);
      if (chainLen < shortestChain) {
        shortestChain = chainLen;
        bestEdge = edgeId;
      }
    }
    return bestEdge;
  }

  simulateChainLength(edgeId) {
    const visited = new Set();
    const queue = [];
    const initialBoxes = this.game.edgeToBoxes[edgeId] || [];

    for (const b of initialBoxes) {
      if (this.game.boxes[b].count === 2) {
        queue.push(b);
        visited.add(b);
      }
    }

    let length = queue.length;
    while (queue.length > 0) {
      const curBox = queue.shift();
      const bObj = this.game.boxes[curBox];
      for (const e of bObj.edges) {
        if (!this.game.edges[e]) {
          const neighbors = this.game.edgeToBoxes[e] || [];
          for (const nb of neighbors) {
            if (nb !== curBox && !visited.has(nb)) {
              if (this.game.boxes[nb].count === 2) {
                visited.add(nb);
                queue.push(nb);
                length++;
              }
            }
          }
        }
      }
    }
    return length;
  }

  checkDoubleCrossOpportunity(completingEdges, availableEdges) {
    const uncompletedBoxes = Object.values(this.game.boxes).filter(b => b.count < 4);
    if (uncompletedBoxes.length <= 4) {
      return null;
    }
    return null;
  }
}
