import { useParams, Link as ReactLink, Prompt } from "react-router-dom";

import {
  Box,
  Text,
  Flex,
  Textarea,
  Button,
  Tooltip,
  Image,
  Spinner,
  Code,
  Spacer,
  Divider,
  useToast,
  Input,
} from "@chakra-ui/react";
import { HStack, VStack, Select } from "@chakra-ui/react";
import { useClipboard } from "@chakra-ui/react";

import {
  ArrowUpIcon,
  ArrowForwardIcon,
  ArrowDownIcon,
  CheckIcon,
  CloseIcon,
  RepeatIcon,
  HamburgerIcon,
  InfoIcon,
  ChevronDownIcon,
  DragHandleIcon,
  DeleteIcon,
  AddIcon,
  QuestionOutlineIcon,
} from "@chakra-ui/icons";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Popover from "@material-ui/core/Popover";
import Paper from "@material-ui/core/Paper";
import stripAnsi from "strip-ansi";
import IconButton from "@material-ui/core/IconButton";

import { FaCut, FaPaste } from "react-icons/fa";

import InfoOutlinedIcon from "@material-ui/icons/InfoOutlined";
import { CgMenuRound } from "react-icons/cg";
// import { CheckIcon } from "@material-ui/icons";
import RefreshIcon from "@material-ui/icons/Refresh";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import { Switch } from "@material-ui/core";
import Popper from "@material-ui/core/Popper";
import TextField from "@material-ui/core/TextField";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import { AiOutlineFunction } from "react-icons/ai";
import Ansi from "ansi-to-react";
import { FcAddColumn, FcDeleteColumn } from "react-icons/fc";
import { v4 as uuidv4 } from "uuid";
// const Diff2html = require("diff2html");
// import { Diff2html } from "diff2html";
import * as Diff2Html from "diff2html";
import "diff2html/bundles/css/diff2html.min.css";

import {
  repoSlice,
  loadPodQueue,
  remoteUpdatePod,
  remoteUpdateAllPods,
  selectIsDirty,
  selectNumDirty,
} from "../../lib/store";
import * as wsActions from "../../lib/ws/actions";

export function SyncStatus({ pod }) {
  const dispatch = useDispatch();
  const isDirty = useSelector(selectIsDirty(pod.id));
  if (pod.isSyncing) {
    return (
      <Box>
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="blue.500"
          size="sm"
        />
      </Box>
    );
  } else if (isDirty) {
    return (
      <Box>
        <Button
          size="xs"
          variant="ghost"
          // icon={}
          // colorScheme={"yellow"}
          onClick={() => {
            dispatch(remoteUpdatePod(pod));
          }}
        >
          <RepeatIcon />
        </Button>
      </Box>
    );
  } else {
    return (
      <Box>
        <Button size="xs" variant="ghost" isDisabled>
          <CheckIcon />
        </Button>
      </Box>
    );
  }
}

export function InfoBar({ pod }) {
  /* eslint-disable no-unused-vars */
  const [value, setValue] = useState(pod.id);
  const { hasCopied, onCopy } = useClipboard(value);
  const [show, setShow] = useState(false);
  const anchorEl = useRef(null);
  return (
    <Box>
      <Button
        size="sm"
        ref={anchorEl}
        onClick={(e) => {
          setShow(!show);
        }}
      >
        {/* <InfoOutlinedIcon /> */}
        <InfoIcon />
      </Button>
      <Popper open={show} anchorEl={anchorEl.current} placement="left-start">
        <Paper>
          <Box p={5}>
            The content of the Popover.
            <Box>
              <Text>
                ID:{" "}
                <Code colorScheme="blackAlpha">
                  {
                    // pod.id.substring(0, 8)
                    pod.id
                  }
                </Code>
                <Button onClick={onCopy}>
                  {hasCopied ? "Copied" : "Copy"}
                </Button>
              </Text>
              <Text>
                Namespace:
                <Code colorScheme="blackAlpha">{pod.ns}</Code>
              </Text>
              <Text mr={5}>Index: {pod.index}</Text>
              <Text>
                Parent:{" "}
                <Code colorScheme="blackAlpha">
                  {pod.parent.substring(0, 8)}
                </Code>
              </Text>
            </Box>
          </Box>
        </Paper>
      </Popper>
    </Box>
  );
}

export function ExportButton({ id }) {
  const anchorEl = useRef(null);
  const [show, setShow] = useState(false);
  const [value, setValue] = useState(null);
  const dispatch = useDispatch();
  return (
    <ClickAwayListener
      onClickAway={() => {
        setShow(false);
      }}
    >
      <Box>
        <Button
          ref={anchorEl}
          variant="ghost"
          size="xs"
          onClick={() => {
            // pop up a input box for entering exporrt
            setShow(!show);
          }}
        >
          <AiOutlineFunction />
        </Button>
        <Popper open={show} anchorEl={anchorEl.current} placement="top">
          <Paper>
            <TextField
              label="Export"
              variant="outlined"
              // focused={show}
              autoFocus
              onChange={(e) => {
                setValue(e.target.value);
              }}
              onKeyDown={(e) => {
                // enter
                // keyCode is deprecated in favor of code, but chrome didn't have
                // it ..
                if (e.keyCode === 13 && value) {
                  console.log("enter pressed, adding", value);
                  dispatch(repoSlice.actions.addPodExport({ id, name: value }));
                  // clear value
                  setValue(null);
                  // click away
                  setShow(false);
                }
              }}
            />
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}

export function UpButton({ pod }) {
  const dispatch = useDispatch();
  const clip = useSelector((state) => state.repo.clip);
  return (
    <HoverButton
      btn1={
        <Button
          variant="ghost"
          size="xs"
          onClick={() => {
            dispatch(
              repoSlice.actions.addPod({
                parent: pod.parent,
                index: pod.index,
                type: pod.type === "DECK" ? "DECK" : pod.type,
                lang: pod.lang,
                column: pod.column,
              })
            );
          }}
        >
          <ArrowUpIcon />
        </Button>
      }
      btn2={
        <IconButton
          disabled={!clip}
          size="small"
          onClick={() => {
            dispatch(
              repoSlice.actions.pastePod({
                parent: pod.parent,
                index: pod.index,
                column: pod.column,
              })
            );
          }}
        >
          <FaPaste />
        </IconButton>
      }
    />
  );
}

export function DownButton({ pod }) {
  const dispatch = useDispatch();
  const clip = useSelector((state) => state.repo.clip);
  return (
    <HoverButton
      btn1={
        <Button
          variant="ghost"
          size="xs"
          onClick={() => {
            dispatch(
              repoSlice.actions.addPod({
                parent: pod.parent,
                index: pod.index + 1,
                type: pod.type === "DECK" ? "DECK" : pod.type,
                lang: pod.lang,
                column: pod.column,
              })
            );
          }}
        >
          <ArrowDownIcon />
        </Button>
      }
      btn2={
        <IconButton
          size="small"
          // I have to use Buttons from material UI when I use disabled
          // together with onMouseLeave, otherwise, when the button is
          // disabled, the onMouseLeave is not called!
          disabled={!clip}
          onClick={() => {
            dispatch(
              repoSlice.actions.pastePod({
                parent: pod.parent,
                index: pod.index + 1,
                column: pod.column,
              })
            );
          }}
        >
          <FaPaste />
        </IconButton>
      }
    />
  );
}

export function RightButton({ pod }) {
  // This is only used in deck
  const dispatch = useDispatch();
  return (
    <Button
      size="xs"
      variant="ghost"
      onClick={() => {
        // 1. add a dec
        dispatch(
          repoSlice.actions.addPod({
            parent: pod.id,
            type: "DECK",
            index: pod.children.length,
            lang: pod.lang,
          })
        );
      }}
    >
      <ArrowForwardIcon />
    </Button>
  );
}

export function ToolBar({ pod }) {
  const dispatch = useDispatch();
  const [show, setShow] = useState(false);
  return (
    <Flex>
      <ExportButton id={pod.id} />
      <UpButton pod={pod} />
      <DownButton pd={pod} />
      <DeleteButton pod={pod} />
    </Flex>
  );
}

export function DeleteButton({ pod }) {
  const dispatch = useDispatch();
  return (
    <HoverButton
      btn1={
        <Button
          variant="ghost"
          size="xs"
          color="red"
          onClick={() => {
            dispatch(repoSlice.actions.deletePod({ id: pod.id }));
          }}
        >
          <DeleteIcon />
        </Button>
      }
      btn2={
        <Button
          variant="ghost"
          size="xs"
          color="red"
          onClick={() => {
            dispatch(repoSlice.actions.markClip({ id: pod.id }));
          }}
        >
          <FaCut />
        </Button>
      }
    />
  );
}

export function HoverButton({ btn1, btn2 }) {
  const [show, setShow] = useState(false);
  const anchorEl = useRef(null);
  return (
    <Box>
      <Box
        ref={anchorEl}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {btn1}
      </Box>
      <Popper
        open={show}
        anchorEl={anchorEl.current}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        placement="top"
      >
        <Paper>{btn2}</Paper>
      </Popper>
    </Box>
  );
}

function LanguageMenu({ pod }) {
  const dispatch = useDispatch();
  return (
    <Box>
      <Select
        size="xs"
        placeholder="Select option"
        value={pod.lang || ""}
        onChange={(e) =>
          dispatch(
            repoSlice.actions.setPodLang({
              id: pod.id,
              lang: e.target.value,
            })
          )
        }
      >
        <option value="python">Python</option>
        <option value="julia">Julia</option>
        <option value="racket">Racket</option>
        <option value="scheme">Scheme</option>
        <option value="javascript">JavaScript</option>
        <option value="typescript">TypeScript</option>
        <option value="css">CSS</option>
        <option value="html">HTML</option>
        <option value="sql">SQL</option>
        <option value="java">Java</option>
        <option value="php">PHP</option>
      </Select>
    </Box>
  );
}

function TypeMenu({ pod }) {
  const dispatch = useDispatch();
  return (
    <Box>
      <Select
        size="xs"
        placeholder="Select option"
        value={pod.type || ""}
        onChange={(e) =>
          dispatch(
            repoSlice.actions.setPodType({
              id: pod.id,
              type: e.target.value,
            })
          )
        }
      >
        <option value="CODE">CODE</option>
        <option value="WYSIWYG">WYSIWYG</option>
        <option value="REPL">REPL</option>
        <option value="MD">Markdown</option>
      </Select>
    </Box>
  );
}

function IOStatus({ id, name }) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const status = useSelector((state) => state.repo.pods[id].io[name]);
  if (!status) {
    return (
      <Box as="span" size="xs" variant="ghost">
        <QuestionOutlineIcon color="orange" />
      </Box>
    );
  } else if ("result" in status) {
    return (
      <Button as="span" size="xs" variant="ghost">
        <CheckIcon color="green" />
      </Button>
    );
  } else if ("error" in status) {
    console.log("Error:", status);
    return (
      <Box>
        <Button
          as="span"
          onClick={(e) => {
            setAnchorEl(e.currentTarget);
          }}
        >
          <CloseIcon color="red" />
        </Button>
        <Popover
          open={Boolean(anchorEl)}
          onClose={() => {
            setAnchorEl(null);
          }}
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "center",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "center",
          }}
        >
          <Box maxW="lg">
            <Text color="red">{status.error.evalue}</Text>
            {status.error.stacktrace && (
              <Text>
                StackTrace:
                <Code whiteSpace="pre-wrap">
                  {stripAnsi(status.error.stacktrace.join("\n"))}
                </Code>
              </Text>
            )}
          </Box>
        </Popover>
      </Box>
    );
  }
}

export function HoveringBar({ pod, showMenu, draghandle }) {
  let dispatch = useDispatch();
  // const [anchorEl, setAnchorEl] = React.useState(null);
  const [show, setShow] = useState(false);
  const anchorEl = useRef(null);
  const [showForce, setShowForce] = useState(false);
  return (
    <Flex>
      {/* <Button
          size="sm"
          onClick={(e) => {
            setAnchorEl(anchorEl ? null : e.currentTarget);
          }}
        >
          Tool
        </Button> */}

      <Box
        ref={anchorEl}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        // onClick={() => setShowForce(!showForce)}
        visibility={showMenu || show || showForce ? "visible" : "hidden"}
        {...draghandle}
        cursor="grab"
      >
        <CgMenuRound size={25} />
      </Box>

      <Popper
        // open={Boolean(anchorEl)}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        open={showForce || show}
        anchorEl={anchorEl.current}
        placement="left-start"
      >
        <Flex
          direction="column"
          bg="white"
          border="1px"
          p={3}
          rounded="md"
          boxShadow="md"
        >
          <HStack>
            <InfoBar pod={pod} />

            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                dispatch(repoSlice.actions.addColumn({ id: pod.id }));
              }}
            >
              <FcAddColumn />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                dispatch(repoSlice.actions.deleteColumn({ id: pod.id }));
              }}
            >
              <FcDeleteColumn />
            </Button>
            <Text as="span">col:{pod.column}</Text>
          </HStack>
          <HStack my={2}>
            <TypeMenu pod={pod} />
            <LanguageMenu pod={pod} />
          </HStack>
          <HStack>
            <Button
              size="sm"
              onClick={() => {
                dispatch(repoSlice.actions.toggleRaw(pod.id));
              }}
            >
              {pod.raw ? "raw" : "wrapped"}
            </Button>
            <Button
              size="sm"
              isDisabled={!pod.lang}
              onClick={() => {
                // 1. create or load runtime socket
                // dispatch(
                //   repoSlice.actions.ensureSessionRuntime({ lang: pod.lang })
                // );
                // clear previous results
                dispatch(repoSlice.actions.clearResults(pod.id));
                // 2. send
                dispatch(wsActions.wsRun(pod.id));
                // 3. the socket should have onData set to set the output
              }}
            >
              Run
            </Button>
          </HStack>
          <Box>
            <MyInputButton
              placeholder="identifier"
              onClick={(name) => {
                dispatch(repoSlice.actions.addPodExport({ id: pod.id, name }));
              }}
            >
              Add Ex-port
            </MyInputButton>
            <MyInputButton
              placeholder="identifier"
              onClick={(name) => {
                dispatch(repoSlice.actions.addPodMidport({ id: pod.id, name }));
              }}
            >
              Add Mid-port
            </MyInputButton>
          </Box>
        </Flex>
      </Popper>
    </Flex>
  );
}

function MyInputButton({ onClick = (v) => {}, placeholder, children }) {
  const [value, setValue] = useState("");
  return (
    <Box>
      <Input
        size="sm"
        // maxWidth={20}
        w="50%"
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      ></Input>
      <Button size="sm" onClick={() => onClick(value)}>
        {children}
      </Button>
    </Box>
  );
}

export function ExportList({ pod }) {
  const dispatch = useDispatch();
  return (
    <Box>
      {pod.exports && Object.keys(pod.exports).length > 0 && (
        <Box>
          <Text as="span" mr={2}>
            Exports:
          </Text>
          {Object.entries(pod.exports).map(([k, v]) => (
            <Box as="span" key={k} mr={1}>
              <Code>{k}</Code>
              <Switch
                size="small"
                checked={v}
                onChange={() => {
                  dispatch(wsActions.wsToggleExport({ id: pod.id, name: k }));
                }}
              />
              <Button
                size="xs"
                color="red"
                variant="ghost"
                onClick={() => {
                  // FIXME also delete all imports for it
                  // Or just show error
                  dispatch(
                    repoSlice.actions.deletePodExport({ id: pod.id, name: k })
                  );
                }}
              >
                <CloseIcon />
              </Button>
              {/* No need IOStatus for exports */}
              {/* <IOStatus id={pod.id} name={k} /> */}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

export function ImportList({ pod }) {
  const dispatch = useDispatch();
  return (
    <Box>
      {pod.imports && Object.keys(pod.imports).length > 0 && (
        <Box>
          <Text as="span" mr={2}>
            Imports:
          </Text>
          {Object.entries(pod.imports).map(([k, v]) => (
            <Box key={k} as="span">
              <Code>{k}</Code>
              <Switch
                size="small"
                checked={v}
                onChange={() => {
                  dispatch(wsActions.wsToggleImport({ id: pod.id, name: k }));
                }}
              />
              <IOStatus id={pod.id} name={k} />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

function MidportList({ pod }) {
  const dispatch = useDispatch();
  return (
    <Box>
      {pod.midports && Object.keys(pod.midports).length > 0 && (
        <Box>
          <Text as="span" mr={2}>
            Midports:
          </Text>
          {Object.entries(pod.midports).map(([k, v]) => (
            <Box key={k}>
              <Switch
                size="small"
                checked={v}
                onChange={() => {
                  dispatch(
                    wsActions.wsToggleMidport({ id: pod.id, name: k })
                    // repoSlice.actions.togglePodMidport({
                    //   id: pod.id,
                    //   name: k,
                    // })
                  );
                }}
              />
              <Code>{k}</Code>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}