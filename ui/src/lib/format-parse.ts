// export {};

import { Node } from "reactflow";
import { defaultMarkdownParser } from "prosemirror-markdown";
import { myNanoId } from "./utils";

interface BaseCell {
  cell_type: string;
  metadata?: any;
  source: string[] | string;
}

interface CodeCell extends BaseCell {
  cell_type: "code";
  execution_count?: number | null;
  outputs?: any[];
}

interface MarkdownCell extends BaseCell {
  cell_type: "markdown";
  source: string[];
}
type XYPostion = { x: number; y: number };

interface CodePodData {
  width?: number;
  height?: number;
  id: string;
  position: XYPostion;
  positionAbsolute: XYPostion;
  parentNode: string;
}

type PodResult = {
  exec_count?: number;
  last_exec_end?: boolean;
  result: {
    type?: string;
    html?: string;
    text?: string;
    image?: string;
  }[];
  running?: boolean;
  lastExecutedAt?: Date;
  stdout?: string;
  stderr?: string;
  error?: { ename: string; evalue: string; stacktrace: string[] } | null;
};

function handleMultilineString(str) {
  const lines = str.split("\n");
  if (lines.length <= 1) {
    return lines;
  }
  // append a newline to all lines except for the last line
  return lines
    .slice(0, -1)
    .map((line) => line + "\n")
    .concat(lines.slice(-1))
    .filter((line) => line !== "");
}

function joinMultilineString(inputs: string | string[]) {
  if (typeof inputs === "string") {
    return inputs;
  }
  return inputs.join("");
}

function resultCell(result) {
  const outputs = new Array();
  const datetime = result.lastExecutedAt as Date;
  result.result.forEach((res) => {
    const data = {};
    switch (res.type) {
      case undefined:
        break;
      case "execute_reply":
        break;
      case "stream_stdout":
        outputs.push({
          output_type: "stream",
          name: "stdout",
          text: handleMultilineString(res.text),
        });
        break;
      case "stream_stderr":
        outputs.push({
          output_type: "stream",
          name: "stderr",
          text: handleMultilineString(res.text),
        });
        break;
      case "execute_result":
        if (res.text) {
          data["text/plain"] = handleMultilineString(res.text);
        }
        if (res.html) {
          data["text/html"] = handleMultilineString(res.html);
        }
        outputs.push({
          output_type: "execute_result",
          data,
          metadata: {},
        });
        break;
      case "display_data":
        if (res.text) {
          data["text/plain"] = handleMultilineString(res.text);
        }
        if (res.html) {
          data["text/html"] = handleMultilineString(res.html);
        }
        if (res.image) data["image/png"] = res.image;
        outputs.push({
          output_type: "display_data",
          data,
          metadata: {},
        });
        break;
      default:
        break;
    }
  });
  if (result.error) {
    outputs.push({
      output_type: "error",
      ename: result.error.ename,
      evalue: "ignored",
      traceback: result.error.stacktrace,
    });
  }
  return outputs;
}

export function codeNodeToCell(
  node: any,
  content: string,
  result: any,
  sourceSplit: boolean = true
): CodeCell {
  const cell: CodeCell = {
    cell_type: "code",
    metadata: node ? { codePodData: node as CodePodData } : {},
    source: sourceSplit ? handleMultilineString(content) : content,
    execution_count: null,
    outputs: [],
  };

  if (result) {
    console.log(resultCell(result));
    const timestamp = result.lastExecutedAt.getTime();
    const status = result.error ? "error" : "ok";
    cell.metadata.executionInfo = {
      timestamp,
      status,
    };
    cell.outputs = resultCell(result);
  }

  return cell;
}

export function richNodeToCell(
  node: any,
  content: string,
  sourceSplit: boolean = true
): MarkdownCell {
  const cell: MarkdownCell = {
    cell_type: "markdown",
    metadata: node ? { codePodData: node as CodePodData } : {},
    source: sourceSplit ? handleMultilineString(content) : content,
  };
  return cell;
}

export function nodesToCells(
  nodes,
  resultMap,
  contentMap,
  markdownMap,
  metaInclude: boolean = false,
  sourceSplit: boolean = true
): BaseCell[] {
  const cells: BaseCell[] = [];
  nodes.forEach((node) => {
    if (node.type === "CODE") {
      const result = resultMap[node.id];
      const content = contentMap[node.id];
      cells.push(
        codeNodeToCell(metaInclude ? node : null, content, result, sourceSplit)
      );
    } else if (node.type === "RICH") {
      const content = markdownMap[node.id];
      cells.push(
        richNodeToCell(metaInclude ? node : null, content, sourceSplit)
      );
    }
  });
  return cells;
}

function outputsToPodResult(outputs: any[]): PodResult {
  const result: PodResult = {
    result: [],
  };
  if (!outputs) return result;
  outputs.forEach((output) => {
    switch (output.output_type) {
      case "execute_result":
        result.result.push({
          type: "execute_result",
          text: output.data["text/plain"],
          html: output.data["text/html"],
        });
        break;
      case "display_data":
        result.result.push({
          type: "display_data",
          text: output.data["text/plain"],
          html: output.data["text/html"],
          image: output.data["image/png"],
        });
        break;
      case "stream":
        if (output.name === "stdout") {
          result.result.push({
            type: "stream_stdout",
            text: output.text,
          });
        } else if (output.name === "stderr") {
          result.result.push({
            type: "stream_stderr",
            text: output.text,
          });
        }
        break;
      case "error":
        result.error = {
          ename: output.ename,
          evalue: output.evalue,
          stacktrace: output.traceback,
        };
        break;
      default:
        break;
    }
  });
  return result;
}

function cellToNode(
  cell: BaseCell,
  parent,
  id,
  position = { x: 0, y: 0 }
): [Node | null, PodResult | null] {
  let node = { id, position, parentNode: parent };
  let result: PodResult | null = null;
  if (cell.metadata.codePodData) {
    node = {
      ...cell.metadata.codePodData,
      id,
      position,
      parentNode: parent,
    };
  }
  if (cell.cell_type === "code") {
    const outputs = (cell as CodeCell).outputs;
    if (outputs) {
      result = outputsToPodResult(outputs);
      if (cell.metadata.executionInfo) {
        result.lastExecutedAt = new Date(cell.metadata.executionInfo.timestamp);
      }
      if (cell.metadata.status) {
        if (!result) result = { result: [] };
        result.result.push({
          type: "execute_reply",
          text: cell.metadata.status,
        });
      }
    }
  }
  return [node as Node, result];
}

function parseCellContent(cell: BaseCell): string {
  if (cell.cell_type === "code") {
    return joinMultilineString((cell as CodeCell).source);
  } else if (cell.cell_type === "markdown") {
    return joinMultilineString((cell as MarkdownCell).source);
  }
  return "";
}

function cellsToNodes(cells, parents) {
  const resultMap: Record<string, PodResult> = {};
  const contentMap: Record<string, string> = {};
  const markdownMap: Record<string, string> = {};
  const nodes: Node[] = [];
  cells.forEach((cell) => {
    const new_id = myNanoId();
    let parent = undefined;
    if (cell.metadata?.codePodData?.id) {
      parent = parents[cell.metadata.codePodData.id];
    }
    const content = parseCellContent(cell);
    contentMap[new_id] = content;
    const [node, result] = cellToNode(cell, parent, new_id);
    nodes[new_id] = node;
    if (result) resultMap[new_id] = result;
    if (cell.cell_type === "markdown") {
      markdownMap[new_id] = content;
    } else if (cell.cell_type === "code") {
      parents[new_id] = new_id;
    }
  });
  return [nodes, resultMap, contentMap, markdownMap];
}
