import { useEffect, useState } from "react";

import { useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";

import { grey } from "@mui/material/colors";

import { useSnackbar } from "notistack";

import { gql, useQuery, useMutation } from "@apollo/client";

import StopIcon from "@mui/icons-material/Stop";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

import { usePrompt } from "./prompt";

import { useRepoStore, selectNumDirty } from "../../lib/store";

function Flex(props) {
  return (
    <Box sx={{ display: "flex" }} {...props}>
      {props.children}
    </Box>
  );
}

function SidebarSession() {
  let { id } = useParams();
  let sessionId = useRepoStore((state) => state.sessionId);
  const repoName = useRepoStore((state) => state.repoName);

  console.log(`Repo ID: ${id} Session ID: ${sessionId}`);

  return (
    <Box>
      <Box>
        Project Name: <Box color="blue">{repoName || "Untitled"}</Box>
      </Box>
    </Box>
  );
}

function SidebarRuntime() {
  const runtimeConnected = useRepoStore((state) => state.runtimeConnected);
  const wsConnect = useRepoStore((state) => state.wsConnect);
  const wsDisconnect = useRepoStore((state) => state.wsDisconnect);
  return (
    <Box>
      <Box>
        Runtime connected?{" "}
        {runtimeConnected ? (
          <Box as="span" color="green">
            Yes
          </Box>
        ) : (
          <Box as="span" color="red">
            No
          </Box>
        )}
      </Box>
      <Box sx={{ display: "flex" }}>
        <Button
          size="small"
          onClick={() => {
            wsConnect();
          }}
        >
          Connect
        </Button>
        {/* <Spacer /> */}
        <Button
          size="small"
          onClick={() => {
            wsDisconnect();
          }}
        >
          Disconnect
        </Button>
      </Box>
    </Box>
  );
}

function SidebarKernel() {
  const kernels = useRepoStore((state) => state.kernels);
  const runtimeConnected = useRepoStore((state) => state.runtimeConnected);
  const wsRequestStatus = useRepoStore((state) => state.wsRequestStatus);
  const wsInterruptKernel = useRepoStore((state) => state.wsInterruptKernel);
  return (
    <Box>
      {/* CAUTION Object.entries is very tricky. Must use for .. of, and the destructure must be [k,v] LIST */}
      {Object.entries(kernels).map(([lang, kernel]) => (
        <Box key={`lang-${lang}`}>
          <Box>
            <Box as="span" color="blue">
              {lang}
            </Box>{" "}
            {runtimeConnected ? (
              <Box as="span" color="green">
                {kernel.status ? kernel.status : "Unknown"}
              </Box>
            ) : (
              <Box color="red" as="span">
                NA
              </Box>
            )}
            <Tooltip title="refresh status">
              <IconButton
                size="small"
                onClick={() => {
                  wsRequestStatus({ lang });
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="interrupt">
              <IconButton
                size="small"
                onClick={() => {
                  wsInterruptKernel({ lang });
                }}
              >
                <StopIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

function ApplyAll() {
  const numDirty = useRepoStore(selectNumDirty());
  const wsRunAll = useRepoStore((s) => s.wsRunAll);
  const clearAllResults = useRepoStore((s) => s.clearAllResults);
  const remoteUpdateAllPods = useRepoStore((s) => s.remoteUpdateAllPods);
  usePrompt(
    `You have unsaved ${numDirty} changes. Are you sure you want to leave?`,
    numDirty > 0
  );

  let [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    setIntervalId(
      setInterval(() => {
        // websocket resets after 60s of idle by most firewalls
        // console.log("periodically saving ..");
        // dispatch(remoteUpdateAllPods());
      }, 1000)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      <Button
        size="small"
        disabled={numDirty === 0}
        onClick={() => {
          remoteUpdateAllPods();
        }}
      >
        <CloudUploadIcon />
        {numDirty > 0 ? (
          <Box as="span" color="blue" mx={1}>
            save {numDirty} to cloud
          </Box>
        ) : (
          <Box as="span" color="grey" mx={1}>
            Saved to cloud.
          </Box>
        )}
      </Button>

      <Flex>
        <Button
          size="small"
          onClick={() => {
            // run all pods
            wsRunAll();
          }}
        >
          Apply All
        </Button>

        {/* <Prompt
          when={numDirty > 0}
          message="You have unsaved changes. Are you sure you want to leave?"
        /> */}

        <Button
          size="small"
          onClick={() => {
            clearAllResults();
          }}
        >
          Clear All
        </Button>
      </Flex>
    </Box>
  );
}

function ActiveSessions() {
  const { loading, data, refetch } = useQuery(gql`
    query GetActiveSessions {
      activeSessions
    }
  `);
  const runtimeConnected = useRepoStore((state) => state.runtimeConnected);
  useEffect(() => {
    console.log("----- refetching active sessions ..");
    refetch();
  }, [runtimeConnected, refetch]);
  const [killSession] = useMutation(
    gql`
      mutation KillSession($sessionId: String!) {
        killSession(sessionId: $sessionId)
      }
    `,
    {
      refetchQueries: ["GetActiveSessions"],
    }
  );
  if (loading) {
    return <Box>Loading</Box>;
  }
  return (
    <Box>
      {data.activeSessions && (
        <Box>
          <Box>Active Sessions:</Box>
          {data.activeSessions.map((k) => (
            <Flex key={k}>
              <Box color="blue">{k}</Box>
              <Button
                size="small"
                onClick={() => {
                  killSession({
                    variables: {
                      sessionId: k,
                    },
                  });
                }}
              >
                Kill
              </Button>
            </Flex>
          ))}
        </Box>
      )}
    </Box>
  );
}

function ToastError() {
  const { enqueueSnackbar } = useSnackbar();
  const error = useRepoStore((state) => state.error);
  const clearError = useRepoStore((state) => state.clearError);
  useEffect(() => {
    if (error) {
      enqueueSnackbar(`ERROR: ${error.msg}`, { variant: error.type });
      // I'll need to clear this msg once it is displayed
      clearError();
    }
  }, [error, enqueueSnackbar, clearError]);
  return <Box></Box>;
}

function SidebarTest() {
  const foldAll = useRepoStore((state) => state.foldAll);
  const unfoldAll = useRepoStore((state) => state.unfoldAll);
  const clearAllExports = useRepoStore((state) => state.clearAllExports);

  return (
    <Box>
      SidebarTest
      <Button
        variant="outlined"
        size="small"
        onClick={() => {
          foldAll();
        }}
      >
        Fold All
      </Button>
      <Button
        variant="outlined"
        size="small"
        onClick={() => {
          unfoldAll();
        }}
      >
        Unfold All
      </Button>
      <Button
        onClick={() => {
          clearAllExports();
        }}
      >
        ClearExports
      </Button>
    </Box>
  );
}

export function Sidebar() {
  return (
    <Box
      sx={{
        mx: 1,
        p: 2,
        boxShadow: 3,
        borderRadius: 2,
        background: grey[50],
      }}
    >
      <Box
        sx={{
          boxShadow: 3,
          p: 2,
          borderRadius: 2,
          background: grey[50],
        }}
      >
        <SidebarSession />
      </Box>
      <Divider my={2} />
      <Box sx={{ boxShadow: 3, p: 2, borderRadius: 2, bg: grey[50] }}>
        <ToastError />
        <ApplyAll />
      </Box>
      <Divider my={2} />

      <Box
        sx={{
          boxShadow: 3,
          p: 2,
          borderRadius: 2,
          bgcolor: grey[50],
        }}
      >
        <SidebarTest />
      </Box>
      <Divider my={2} />
      <Box
        sx={{
          boxShadow: 3,
          p: 2,
          borderRadius: 2,
          bg: grey[50],
        }}
      >
        <SidebarRuntime />
        <SidebarKernel />
        <ActiveSessions />
      </Box>

      <Divider my={2} />
      {/* <ConfigButton /> */}
    </Box>
  );
}
