import { JSDOM } from "jsdom";

import Y from "yjs";

import myspec from "./rich-schema";
import { Schema, Node as PMNode } from "prosemirror-model";
import {
  prosemirrorToYDoc,
  prosemirrorToYXmlFragment,
  yXmlFragmentToProsemirrorJSON,
  yDocToProsemirror,
  yXmlFragmentToProsemirror,
} from "y-prosemirror";
import { MarkdownSerializer } from "prosemirror-markdown";

const myschema = new Schema(myspec);
/**
 * From prosemirror json to Y.XmlFragment.
 * @param json Parsed json object.
 * @returns
 */
export function json2yxml(json: Object) {
  const doc2 = PMNode.fromJSON(myschema, json);
  // console.log("PMDoc2", doc2);
  const yxml = prosemirrorToYXmlFragment(doc2);
  // console.log("Ydoc2", ydoc2.toJSON());
  return yxml;
}

export function yxml2json(yxml) {
  return yXmlFragmentToProsemirrorJSON(yxml);
}

export function yxml2node(yxml) {
  return yXmlFragmentToProsemirror(myschema, yxml);
}
