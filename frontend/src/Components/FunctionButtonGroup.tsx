import React from "react";

import {
  Button,
  Tooltip,
  Popover,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@material-ui/core";
import { makeStyles, createStyles, Theme } from "@material-ui/core/styles";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    typography: {
      padding: theme.spacing(2),
    },
  })
);

export default function FunctionButtonGroup() {
  const classes = useStyles();

  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null
  );
  const raiseHandOpen = Boolean(anchorEl);
  const id = raiseHandOpen ? "raise-hand-popover" : undefined;

  const handleRaiseHandOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleRaiseHandClose = () => {
    setAnchorEl(null);
  };

  const [switchRoomOpen, setSwitchRoomOpen] = React.useState(false);
  const handleSwitchRoomOpen = () => {
    setSwitchRoomOpen(true);
  };
  const handleSwitchRoomClose = () => {
    setSwitchRoomOpen(false);
  };

  return (
    <div>
      <Tooltip title="Giơ tay">
        <button onClick={handleRaiseHandOpen}>✋</button>
      </Tooltip>
      <Popover
        id={id}
        open={raiseHandOpen}
        anchorEl={anchorEl}
        onClose={handleRaiseHandClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Typography className={classes.typography}>
          Chức năng này sẽ xuất hiện trong phiên bản sau.
        </Typography>
      </Popover>

      <Tooltip title="Chuyển phòng">
        <button onClick={handleSwitchRoomOpen}>🔀</button>
      </Tooltip>
      <Dialog
        open={switchRoomOpen}
        onClose={handleSwitchRoomClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Xác nhận chuyển phòng"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Bạn có muốn chuyển sang một phòng ngẫu nhiên khác?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSwitchRoomClose} color="primary" autoFocus>
            Đồng ý
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
