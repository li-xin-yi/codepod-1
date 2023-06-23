import { useStore } from "zustand";
import { RepoContext } from "../lib/store";
import Box from "@mui/material/Box";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuList from "@mui/material/MenuList";
import MenuItem from "@mui/material/MenuItem";
import React, { useContext } from "react";
import CodeIcon from "@mui/icons-material/Code";
import PostAddIcon from "@mui/icons-material/PostAdd";
import NoteIcon from "@mui/icons-material/Note";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import { useApolloClient } from "@apollo/client";

const paneMenuStyle = (left, top) => {
  return {
    left: `${left}px`,
    top: `${top}px`,
    zIndex: 100,
    position: "absolute",
    boxShadow: "0px 1px 8px 0px rgba(0, 0, 0, 0.1)",
    // width: '200px',
    backgroundColor: "#fff",
    borderRadius: "5px",
    boxSizing: "border-box",
  } as React.CSSProperties;
};

const ItemStyle = {
  "&:hover": {
    background: "#f1f3f7",
    color: "#4b00ff",
  },
};

export function CanvasContextMenu(props) {
  const store = useContext(RepoContext);
  if (!store) throw new Error("Missing BearContext.Provider in the tree");
  const showLineNumbers = useStore(store, (state) => state.showLineNumbers);
  const flipShowLineNumbers = useStore(
    store,
    (state) => state.flipShowLineNumbers
  );
  const client = useApolloClient();
  const autoCompletion = useStore(store, (state) => state.autoCompletion);
  const flipAutoCompletion = useStore(
    store,
    (state) => state.flipAutoCompletion
  );

  console.log("autoCompletion", autoCompletion);
  const isGuest = useStore(store, (state) => state.role === "GUEST");
  return (
    <Box sx={paneMenuStyle(props.x, props.y)}>
      <MenuList className="paneContextMenu">
        {!isGuest && (
          <MenuItem onClick={props.addCode} sx={ItemStyle}>
            <ListItemIcon sx={{ color: "inherit" }}>
              <CodeIcon />
            </ListItemIcon>
            <ListItemText>New Code</ListItemText>
          </MenuItem>
        )}
        {!isGuest && (
          <MenuItem onClick={props.addRich} sx={ItemStyle}>
            <ListItemIcon sx={{ color: "inherit" }}>
              <NoteIcon />
            </ListItemIcon>
            <ListItemText>New Note</ListItemText>
          </MenuItem>
        )}
        {!isGuest && (
          <MenuItem onClick={props.addScope} sx={ItemStyle}>
            <ListItemIcon sx={{ color: "inherit" }}>
              <PostAddIcon />
            </ListItemIcon>
            <ListItemText>New Scope</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => flipAutoCompletion(client)} sx={ItemStyle}>
          <ListItemIcon sx={{ color: "inherit" }}>
            <AutoFixHighIcon />
          </ListItemIcon>
          <ListItemText>
            {autoCompletion ? "Disable " : "Enable "} Auto Completion (Provided
            by Codeium)
          </ListItemText>
        </MenuItem>
      </MenuList>
    </Box>
  );
}
