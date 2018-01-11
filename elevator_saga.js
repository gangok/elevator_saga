{
    init: function(elevators, floors) {
        function isStopped(elevator) {
            return elevator.status == "stop";
        }
        function isGoingUp(elevator) {
            return elevator.status == "up";
        }
        function isGoingDown(elevator) {
            return elevator.status == "down";
        }
        function isDestSame(elevator, destFloorNum) {
            return elevator.currentFloor() == destFloorNum;
        }
        function isDestUpper(elevator, destFloorNum) {
            return elevator.currentFloor() < destFloorNum;
        }
        function isDestLower(elevator, destFloorNum) {
            return elevator.currentFloor() > destFloorNum;
        }
        function isDestDir(elevator, destFloorNum, direction) {
            if(direction) {
                return isDestUpper(elevator, destFloorNum);
            } else {
                return isDestLower(elevator, destFloorNum);
            }
        }
        function isSpaceAvailable(elevator) {
            var num = 1;
            var estimateAvailableNum = elevator.maxPassengerCount() * (1 - elevator.loadFactor() - 0.1);
            return estimateAvailableNum >= num;
        }
        function setStop(elevator) {
            elevator.status = "stop";
            elevator.goingDownIndicator(false);
            elevator.goingUpIndicator(false);
        }
        function setDirection(elevator, isDirectionUp) {
            if(isDirectionUp) {
                elevator.status = "up";
            } else {
                elevator.status = "down";
            }
            elevator.goingDownIndicator(!isDirectionUp);
            elevator.goingUpIndicator(isDirectionUp);
        }
        function addDestination(elevator, destFloorNum) {
            console.log("addDestination called" + elevator + "," + destFloorNum);
            if (isStopped(elevator)) {
                elevator.goToFloor(destFloorNum);
            } else if(isGoingUp(elevator) && (isDestUpper(elevator, destFloorNum) || isDestSame(elevator, destFloorNum))) {
                for(var i=0;i<elevator.destinationQueue.length;i++) {
                    if (elevator.destinationQueue[i] > destFloorNum) {
                        break;
                    } else if(elevator.destinationQueue[i] == destFloorNum) {
                        return;
                    }
                }
                elevator.destinationQueue.splice(i,0,destFloorNum);
                elevator.checkDestinationQueue();
            } else if(isGoingDown(elevator) && (isDestLower(elevator, destFloorNum)  || isDestSame(elevator, destFloorNum))) {
                for(var i=0;i<elevator.destinationQueue.length;i++) {
                    if (elevator.destinationQueue[i] < destFloorNum) {
                        break;
                    } else if(elevator.destinationQueue[i] == destFloorNum) {
                        return;
                    }
                }
                elevator.destinationQueue.splice(i,0,destFloorNum);
                elevator.checkDestinationQueue();
            } else {
                console.log("something error in addDestination" + elevator.toString() + "," + destFloorNum);
                elevator.goToFloor(destFloorNum);
            }
        }
        function isButtonPressed(floorNum, isUp, elevator) {
            if(buttonPressed[floorNum][isUp].onOff) {
                if(buttonPressed[floorNum][isUp].assignElevatorNo == null ||
                    buttonPressed[floorNum][isUp].assignElevatorNo == elevator.elevatorNum) {
                    return true;
                } else {
                    console.log("isButtonPressed assigNo : "+buttonPressed[floorNum][isUp].assignElevatorNo);
                }
            }
            return false;
        }
        function setButtonPressed(floorNum, isUp, value) {
            console.log("setButton" + floorNum + (isUp ? "up" : "down") + value);
            buttonPressed[floorNum][isUp].onOff = value;
            if (value == true) {
                buttonPressed[floorNum][isUp].assignElevatorNo = null;
            }
        }
        function assignButtonPressed(floorNum, isUp, elevator) {
            buttonPressed[floorNum][isUp].assignElevatorNo = elevator.elevatorNum;
        }
        function findClosestFloorNumWithButtonPressed(nowFloorNum, findingDirection, buttonPressedDirection, elevator) {
            if(findingDirection) {
                for(var floorNum = nowFloorNum; floorNum < FLOOR_NUM; floorNum++) {
                    if(isButtonPressed(floorNum, buttonPressedDirection, elevator)) {
                        return floorNum;
                    }
                }
                return null;
            } else {
                for(var floorNum = nowFloorNum; floorNum >= 0; floorNum--) {
                    if(isButtonPressed(floorNum, buttonPressedDirection, elevator)) {
                        return floorNum;
                    }
                }
                return null;
            }
        }
        function findFarthestFloorNumWithButtonPressed(nowFloorNum, findingDirection, buttonPressedDirection, elevator) {
            if(findingDirection) {
                for(var floorNum = FLOOR_NUM - 1; floorNum >= nowFloorNum; floorNum--) {
                    if(isButtonPressed(floorNum, buttonPressedDirection, elevator)) {
                        return floorNum;
                    }
                }
                return null;
            } else {
                for(var floorNum = 0; floorNum <= nowFloorNum; floorNum++) {
                    if(isButtonPressed(floorNum, buttonPressedDirection, elevator)) {
                        return floorNum;
                    }
                }
                return null;
            }
        }
        function findStoppedElevator(elevators) {
            for(var i=0;i<ELEVATOR_NUM;i++) {
                if (isStopped(elevators[i])) {
                    return elevators[i];
                }
            }
            return null;
        }
        function registerElevatorEvent(elevator) {
            elevator.on("idle", function() {
                if(DEBUG_MODE) {
                    console.log("idle" + elevator.toString());
                }
                var oldDirection = isGoingUp(elevator);
                var nowFloorNum = elevator.currentFloor();
                if(elevator.getPressedFloors().length > 0) {
                    //idle인데 누군가 타고있다!
                    //눌린 버튼을 기준으로 방향을 설정하되 이번 층에서도 방향이 같으면 태우자!
                    console.log("something strange but keep going, became idle with passensers inside" + elevator.toString());
                    var direction = isDestUpper(elevator, elevator.getpressedFloors()[0]);
                    if (isSpaceAvailable(elevator) && isButtonPressed(nowFloorNum, direction, elevator)) {
                        setDirection(elevator, direction);
                        addDestination(elevator, nowFloorNum);
                    }
                    for(var i=0; i<elevator.getPressedFloors().length; i++) {
                        if(isDestDir(elevator, elevator.getPressedFloors()[i], direction)) {
                            addDestination(elevator, elevator.getPressedFloors()[i]);
                        }
                    }
                    return;
                }
                //엘베가 비었다! 행동을 결정하자
                //1. 가던 방향으로 쭉 간다
                //1-1. 가던 방향의 층에 있는 사람들 중 가던 방향으로 가려는 가장 가까운 사람을 태운다.
                var destFloorNum = findClosestFloorNumWithButtonPressed(nowFloorNum, oldDirection, oldDirection, elevator);
                if(destFloorNum != null) {
                    if (isDestSame(elevator, destFloorNum)) {
                        setDirection(elevator, oldDirection);
                    } else {
                        setDirection(elevator, oldDirection);
                    }
                    addDestination(elevator, destFloorNum);
                    assignButtonPressed(destFloorNum, oldDirection, elevator);
                    return;
                }
                //1-2. 가던 방향의 층에 있는 사람들 중 반대 방향으로 가려는 가장 먼 사람을 태운다.
                var destFloorNum = findFarthestFloorNumWithButtonPressed(nowFloorNum, oldDirection, !oldDirection, elevator);
                if(destFloorNum != null) {
                    if (isDestSame(elevator, destFloorNum)) {
                        setDirection(elevator, !oldDirection);
                    } else {
                        setDirection(elevator, oldDirection);
                    }
                    addDestination(elevator, destFloorNum);
                    assignButtonPressed(destFloorNum, !oldDirection, elevator);
                    return;
                }
                //2. 반대 방향으로 간다
                //2-1. 반대 방향의 층에 있는 사람들 중 반대 방향으로 가려는 가장 가까운 사람을 태운다.
                var destFloorNum = findClosestFloorNumWithButtonPressed(nowFloorNum, !oldDirection, !oldDirection, elevator);
                if(destFloorNum != null) {
                    if (isDestSame(elevator, destFloorNum)) {
                        setDirection(elevator, !oldDirection);
                    } else {
                        setDirection(elevator, !oldDirection);
                    }
                    addDestination(elevator, destFloorNum);
                    assignButtonPressed(destFloorNum, !oldDirection, elevator);
                    return;
                }
                //2-2. 반대 방향의 층에 있는 사람들 중 가던 방향으로 가려는 가장 먼 사람을 태운다.
                var destFloorNum = findFarthestFloorNumWithButtonPressed(nowFloorNum, !oldDirection, oldDirection, elevator);
                if(destFloorNum != null) {
                    if (isDestSame(elevator, destFloorNum)) {
                        setDirection(elevator, oldDirection);
                    } else {
                        setDirection(elevator, !oldDirection);
                    }
                    addDestination(elevator, destFloorNum);
                    assignButtonPressed(destFloorNum, oldDirection, elevator);
                    return;
                }
                setStop(elevator);
            });
            elevator.on("floor_button_pressed", function(floorNum) {
                if(DEBUG_MODE) {
                    console.log("floor_button_pressed" + floorNum + elevator.toString());
                }
                if(isStopped(elevator)) {
                    setDirection(elevator, isDestUpper(elevator, floorNum));
                    addDestination(elevator, floorNum);
                } else if(isDestDir(elevator, floorNum, isGoingUp(elevator))) {
                    addDestination(elevator, floorNum);
                } else {
                    console.log("wrong passenger in elevator" + elevator.toString());
                }
            });
            elevator.on("passing_floor", function(floorNum, directionString) {
                if(DEBUG_MODE) {
                    console.log("passing_floor" + floorNum + directionString +elevator.toString());
                }
                var direction = directionString == "up";
                if (isSpaceAvailable(elevator) && isButtonPressed(floorNum, direction, elevator)) {
                    addDestination(elevator, floorNum);
                }
            });
            elevator.on("stopped_at_floor", function(floorNum) {
                if(DEBUG_MODE) {
                    console.log("stopped_at_floor" + floorNum + elevator.toString());
                }
                var direction = isGoingUp(elevator);
                setButtonPressed(floorNum, direction, false);
            })
        }
        function registerFloorEvent(floor) {
            floor.on("up_button_pressed", function() {
                console.log("up_button pressed called" + floor.floorNum());
                var elevator = findStoppedElevator(elevators);
                setButtonPressed(floor.floorNum(), true, true);
                if(elevator == null) {
                    return;
                }
                if (isDestSame(elevator, floor.floorNum())) {
                    setDirection(elevator, true);
                } else {
                    setDirection(elevator, isDestUpper(elevator, floor.floorNum()));
                }
                addDestination(elevator, floor.floorNum());
            });

            floor.on("down_button_pressed", function() {
                console.log("down_button pressed called" + floor.floorNum());
                var elevator = findStoppedElevator(elevators);
                setButtonPressed(floor.floorNum(), false, true);
                if(elevator == null) {
                    return;
                }
                if (isDestSame(elevator, floor.floorNum())) {
                    setDirection(elevator, false);
                } else {
                    setDirection(elevator, isDestUpper(elevator, floor.floorNum()));
                }
                addDestination(elevator, floor.floorNum());
            });
        }

        var DEBUG_MODE = true;
        var FLOOR_NUM = floors.length;
        var ELEVATOR_NUM = elevators.length;
        var buttonPressed = new Array(FLOOR_NUM);
        for(var i = 0;i < FLOOR_NUM;i++) {
            buttonPressed[i] = {true:{onOff:false, assignElevatorNo:null}, false:{onOff:false, assignElevatorNo:null}};
        }

        for(var i = 0;i < ELEVATOR_NUM;i++) {
            var elevator = elevators[i];
            elevator.elevatorNum = i;
            setStop(elevator);
            elevator.toString = function() {
                return "elevator" + this.elevatorNum + this.status + "currentPosition:" + this.currentFloor();
            }
            registerElevatorEvent(elevator);
        }

        for(i=0;i < floors.length; i++) {
            registerFloorEvent(floors[i]);
        }
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}