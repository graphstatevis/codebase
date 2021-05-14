import { Graph } from './GraphVisTypes';

export class GraphTemplates {
  public static probability = 0.5;

  public static Random(vertices?: number, startIndex?: number): Graph {
    if (!startIndex) startIndex = 1;
    if (!vertices) vertices = 5;
    let p = GraphTemplates.probability;

    const graph: Graph = {
      edges : [],
      nodes: [],
      parameterized: true,
      title: 'Random',
    };

    for (let i = startIndex; i <= vertices; i++) {
      for (let j = i + startIndex; j <= vertices; j++) {
        if(Math.random() <= p)
          graph.edges.push({ source: i, target: j, weight: 1, optionalLabel: 'Optional Edge Label' });
      }
    }

    // Initialize Nodes
    for (let index = startIndex; index <= vertices; index++) {
      graph.nodes.push({
        id: index,
        optionalLabel: 'Optional Node Label'
      });
    }

    return graph;
  }

  /*
   * Info: https://en.wikipedia.org/wiki/Star_(graph_theory)
   */
  public static Star(vertices?: number, startIndex?: number): Graph {
    if (!startIndex) startIndex = 1;
    if (!vertices) vertices = 5;

    const graph: Graph = {
      edges : [],
      nodes: [],
      parameterized: true,
      title: 'Star',
    };

    for (let i = 2; i <= vertices; i++) {
      graph.edges.push({
        optionalLabel: 'Optional Edge Label', source: 1, target: i, weight: 1,
      });
    }

    // Initialize Nodes
    for (let index = 1; index <= vertices; index++) {
      graph.nodes.push({
        id: index,
        optionalLabel: 'Optional Node Label'
      });
    }

    return graph;
  }

  /*
   * Info: https://en.wikipedia.org/wiki/Star_(graph_theory)
   */
  public static Pusteblume(vertices?: number, startIndex?: number): Graph {
    if (!startIndex) startIndex = 1;
    if (!vertices) vertices = 8;
    if (vertices < 5) vertices = 5;

    const graph: Graph = {
      edges : [
        { source: 1, target: 2, weight: 1, optionalLabel: 'Optional Edge Label' },
        { source: 1, target: 3, weight: 1, optionalLabel: 'Optional Edge Label' },
        { source: 1, target: 4, weight: 1, optionalLabel: 'Optional Edge Label' },
      ],
      nodes: [],
      title: 'Pusteblume',
    };

    for (let i = startIndex + 4; i <= vertices; i++) {
      graph.edges.push({ source: 4, target: i, weight: 1, optionalLabel: 'Optional Edge Label' });
    }

    // Initialize Nodes
    for (let index = startIndex; index <= vertices; index++) {
      graph.nodes.push({
        // group: Math.round(Math.random()), // 0 or 1
        id: index,
        optionalLabel: 'Optional Node Label'
      });
    }

    return graph;
  }

  /*
   * Info: https://en.wikipedia.org/wiki/Complete_graph
   */
  public static CompleteGraph(vertices?: number, startIndex?: number): Graph {
    if (!startIndex) startIndex = 1;
    if (!vertices) vertices = 5;

    const graph: Graph = {
      edges : [],
      nodes: [],
      parameterized: true,
      title: 'Complete Graph',
    };

    for (let i = startIndex; i <= vertices; i++) {
      for (let j = i + startIndex; j <= vertices; j++) {
        graph.edges.push({ source: i, target: j, weight: 1, optionalLabel: 'Optional Edge Label' });
      }
    }

    // Initialize Nodes
    for (let index = startIndex; index <= vertices; index++) {
      graph.nodes.push({
        id: index,
        optionalLabel: 'Optional Node Label'
      });
    }

    return graph;
  }

  /*
   * Info: https://quantum-journal.org/papers/q-2020-10-22-348/
   */
  public static BellPairs(vertices?: number, startIndex?: number): Graph {
    if (!startIndex) startIndex = 1;
    if (!vertices) vertices = 5;
    if (vertices % 2 !== 0) vertices -= 1;

    const graph: Graph = {
      edges : [],
      nodes: [],
      parameterized: true,
      title: 'Bell Pairs',
    };

    for (let i = startIndex; i <= vertices/2; i++) {
      graph.edges.push({ source: 2*i, target: 2*i-1, weight: 1, optionalLabel: 'Optional Edge Label' });
    }

    // Initialize Nodes
    for (let index = startIndex; index <= vertices; index++) {
      graph.nodes.push({
        id: index,
        optionalLabel: 'Optional Node Label'
      });
    }

    return graph;
  }

  /*
   * Info: https://bit.ly/2SFX14L
   */  
  public static Ring(vertices?: number, startIndex?: number): Graph {
    if (!startIndex) startIndex = 1;
    if (!vertices) vertices = 5;

    const graph: Graph = {
      edges : [],
      nodes: [],
      parameterized: true,
      title: 'Ring',
    };

    for (let i = 1; i <= vertices; i++) {
      graph.edges.push({
        optionalLabel: 'Optional Edge Label',
        source: i,
        target: (i % vertices + 1),
        weight: 1,
      });
    }

    // Initialize Nodes
    for (let index = 1; index <= vertices; index++) {
      graph.nodes.push({        
        id: index,
        optionalLabel: 'Optional Node Label'
      });
    }

    return graph;
  }

  /*
   * Info: https://en.wikipedia.org/wiki/Path_graph
   */  
  public static Path(vertices?: number, startIndex?: number): Graph {
    if (!startIndex) startIndex = 1;
    if (!vertices) vertices = 5;

    const graph: Graph = {
      edges : [],
      nodes: [],
      parameterized: true,
      title: 'Path',
    };

    for (let i = 1; i < vertices; i++) {
      graph.edges.push({
        optionalLabel: 'Optional Edge Label',
        source: i,
        target: i + 1,
        weight: 1,
      });
    }

    // Initialize Nodes
    for (let index = 1; index <= vertices; index++) {
      graph.nodes.push({
        id: index,
        optionalLabel: 'Optional Node Label'
      });
    }

    return graph;
  }


  /** 
   * Info: https://en.wikipedia.org/wiki/M%C3%B6bius_ladder
   */
  public static Moebius(vertices?: number, startIndex?: number): Graph {
    if (!startIndex) startIndex = 1;
    if (!vertices) vertices = 6;
    if (vertices % 2 !== 0) vertices -= 1;

    const graph: Graph = {
      edges : [],
      nodes: [],
      parameterized: true,
      title: 'Möbius Strip',
    };

    for (let i = 1; i < vertices; i++) {
      graph.edges.push({
        optionalLabel: 'Optional Edge Label',
        source: i,
        target: i % vertices + 1,
        weight: 1,
      });
    }

    for (let i = 1; i < vertices / 2; i++) {
      graph.edges.push({
        optionalLabel: 'Optional Edge Label',
        source: i,
        target: vertices - (i - 1),
        weight: 1,
      });
    }

    graph.edges.push({
      optionalLabel: 'Optional Edge Label',
      source: 1,
      target: vertices / 2 + 1,
      weight: 1,
    });

    graph.edges.push({
      optionalLabel: 'Optional Edge Label',
      source: vertices,
      target: vertices / 2,
      weight: 1,
    });

    // Initialize Nodes
    for (let index = 1; index <= vertices; index++) {
      graph.nodes.push({
        id: index,
        optionalLabel: 'Optional Node Label'
      });
    }

    return graph;
  }
  
  /** 
   * Info: https://en.wikipedia.org/wiki/M%C3%B6bius_ladder
   */
  public static Wheel(vertices?: number, startIndex?: number): Graph {
    if (!startIndex) startIndex = 1;
    if (!vertices) vertices = 6;
    if (vertices % 2 !== 0) vertices -= 1;

    const graph: Graph = {
      edges : [],
      nodes: [],
      parameterized: true,
      title: 'Wheel',
    };

    for (let i = 1; i < vertices; i++) {
      graph.edges.push({
        optionalLabel: 'Optional Edge Label',
        source: i,
        target: i % vertices + 1,
        weight: 1,
      });
    }

    for (let i = 1; i < vertices / 2; i++) {
      graph.edges.push({
        optionalLabel: 'Optional Edge Label',
        source: i,
        target: vertices - (i - 1),
        weight: 1,
      });
    }

    graph.edges.push({
      optionalLabel: 'Optional Edge Label',
      source: 1,
      target: vertices / 2,
      weight: 1,
    });

    graph.edges.push({
      optionalLabel: 'Optional Edge Label',
      source: vertices,
      target: vertices / 2 + 1,
      weight: 1,
    });

    // Initialize Nodes
    for (let index = 1; index <= vertices; index++) {
      graph.nodes.push({
        id: index,
        optionalLabel: 'Optional Node Label'
      });
    }

    return graph;
  }

  public static get All(): ((vertices?: number, start?: number) => Graph)[] {
    return [this.CompleteGraph, this.Star, this.Pusteblume,
      this.BellPairs,  this.Wheel,  this.Moebius, this.Ring , this.Random ];
  }
}
