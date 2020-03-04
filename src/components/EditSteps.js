import React, { useState, useEffect } from "react";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import firebase from "../firebase";
import "firebase/auth";
import Calendar from "react-calendar";
import DaySteps from "./DaySteps";
import { Button, TextField } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex"
  },
  button: {
    background: "#171820",
    border: 0,
    borderRadius: 3,
    color: "white",
    height: 48,
    padding: "0 30px"
  },
  appBarSpacer: theme.mixins.toolbar,

  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4)
  },
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    justifyContent: "flexEnd",
    flexDirection: "column",
    backgroundColor: "#E7E5DF"
  },

  textInput: {
    width: "20vw",
    marginBottom: "20px",
    "& label.Mui-focused": {
      color: "#171820"
    },
    "& .MuiInput-underline:after": {
      borderBottomColor: "#171820"
    }
  },
  calendar: {
    width: "450px"
  }
}));

function onEditSteps(date, steps) {
  if (date !== "") {
    const userId = firebase.auth().currentUser.uid;

    const docRef = firebase
      .firestore()
      .collection("users")
      .doc(userId)
      .collection("steps")
      .doc(date.toString());

    return docRef
      .set({
        steps: steps
      })
      .then(function() {
        console.log("successfully added steps document");
      })
      .catch(function(error) {
        console.log(error);
      });
  }
}

function onEditDailyTotals(date, steps, dayStepCount) {
  if (date !== "") {
    const userId = firebase.auth().currentUser.uid;
    const decrement = -1 * dayStepCount;

    const docRef = firebase
      .firestore()
      .collection("dailyTotals")
      .doc(date.toString());

    docRef
      .set(
        {
          totalSteps: firebase.firestore.FieldValue.increment(decrement)
        },
        { merge: true }
      )
      .then(function() {
        console.log("successfully incremented daily total steps document");
      })
      .catch(function(error) {
        console.log(error);
      });

    return docRef
      .set(
        {
          totalSteps: firebase.firestore.FieldValue.increment(steps)
        },
        { merge: true }
      )
      .then(function() {
        console.log("successfully incremented daily total steps document");
      })
      .catch(function(error) {
        console.log(error);
      });
  }
}

function calculateTotal(docs) {
  let totalSteps = 0;
  docs.map(doc => {
    totalSteps += doc.steps;
  });

  const userId = firebase.auth().currentUser.uid;

  const docRef = firebase
    .firestore()
    .collection("users")
    .doc(userId);

  return docRef
    .update({
      totalSteps: totalSteps
    })
    .then(function() {
      console.log("successfully updated total steps");
    })
    .catch(function(error) {
      console.log(error);
    });
}

const SORT_OPTIONS = {
  STEPS_ASC: { column: "steps", direction: "asc" },
  STEPS_DESC: { column: "steps", direction: "desc" }
};

function useSteps(sortBy = "STEPS_DESC") {
  const [steps, setSteps] = useState([]);
  const userId = firebase.auth().currentUser.uid;

  useEffect(() => {
    const unsubscribe = firebase
      .firestore()
      .collection("users")
      .doc(userId)
      .collection("steps")
      .orderBy(SORT_OPTIONS[sortBy].column, SORT_OPTIONS[sortBy].direction)
      .onSnapshot(snapshot => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setSteps(docs);
        calculateTotal(docs);
      });

    return () => unsubscribe();
  }, []);

  return steps;
}

function showStepCount(date) {}

const EditSteps = () => {
  const classes = useStyles();
  const fixedHeightPaper = clsx(classes.paper, classes.fixedHeight);

  const [date, setDate] = useState("");
  const [steps, setSteps] = useState(0);
  const [sortBy, setSortBy] = useState("STEPS_DESC");
  const [selectedDate, setSelectedDate] = useState("");

  const savedSteps = useSteps(sortBy);

  let dayStepCount = "0";

  savedSteps.map(step => {
    if (step.id === selectedDate.toString()) {
      dayStepCount = step.steps;
    }
  });

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column"
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "40px"
        }}
      >
        <Paper className={classes.paper}>
          <Calendar
            className={classes.calendar}
            onChange={newDate => setDate(newDate)}
            value={date}
            onClickDay={selectedDate => {
              showStepCount(selectedDate);
              setSelectedDate(selectedDate);
            }}
          />
        </Paper>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center"
        }}
      >
        <div
          style={{
            flex: 2,
            display: "flex"
          }}
        />
        {selectedDate && (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              marginTop: "40px",
              justifyContent: "center"
            }}
          >
            <Paper className={classes.paper}>
              <TextField
                className={classes.textInput}
                label="enter # of steps"
                type="number"
                inputProps={{ min: "0" }}
                onChange={event => {
                  setSteps(parseInt(event.target.value));
                }}
              />
              <Button
                onClick={e => {
                  onEditSteps(date, steps);
                  onEditDailyTotals(date, steps, dayStepCount);
                }}
                className={classes.button}
              >
                Update Steps
              </Button>
            </Paper>
          </div>
        )}

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            marginTop: "40px",
            justifyContent: "center"
          }}
        >
          <Paper className={classes.paper}>
            <DaySteps
              totalDaySteps={dayStepCount}
              selectedDate={selectedDate}
            />
          </Paper>
        </div>

        <div
          style={{
            flex: 2,
            display: "flex"
          }}
        />
      </div>
    </div>
  );
};

export default EditSteps;
