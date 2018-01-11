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
        function isInUpWay(elevator, floorNum) {
            return elevator.status == "up" && elevator.currentFloor() <= floorNum;
        }
        function isInDownWay(elevator, floorNum) {
            return elevator.status == "down" && elevator.currentFloor() >= floorNum;
        }
        function isDestUp(elevator, DestFloorNum) {
            return elevator.currentFloor() < DestFloorNum;
        }
        function isDestDown(elevator, DestFloorNum) {
            return elevator.currentFloor() > DestFloorNum;
        }
        function isEmptyQueue(elevator) {
            return elevator.destinationQueue.length == 0;
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
        function addDestination(elevator, destFloorNum, isDirectionUp) {
            console.log("addDestination called" + elevator + "," + destFloorNum + "," + isDirectionUp);
            if (isStopped(elevator)) {
                setDirection(elevator, isDirectionUp);
                elevator.goToFloor(destFloorNum);
            } else if(isGoingUp(elevator) && isDestUp(elevator, destFloorNum)) {
                var i;
                for(i=0;i<elevator.destinationQueue.length;i++) {
                    if (elevator.destinationQueue[i] > destFloorNum) {
                        break;
                    }
                }
                elevator.destinationQueue.splice(i,0,destFloorNum);
                elevator.checkDestinationQueue();
            } else if(isGoingDown(elevator) && isDestDown(elevator, destFloorNum)) {
                var i;
                for(i=0;i<elevator.destinationQueue.length;i++) {
                    if (elevator.destinationQueue[i] < destFloorNum) {
                        break;
                    }
                }
                elevator.destinationQueue.splice(i,0,destFloorNum);
                elevator.checkDestinationQueue();
            }
        }
        function addWaitingQueue(destFloorNum, isDirectionUp) {
            waitingQueue.push({num:destFloorNum, dir:isDirectionUp});
        }
        function popWaitingQueue() {
            ret = waitingQueue[0];
            waitingQueue.splice(0,1);
            return ret;
        }
        function isWaitingQueueEmpty() {
            return waitingQueue.length == 0;
        }
        var waitingQueue = [];
        var elevator = elevators[0]; // Let's use the first elevator
        setStop(elevator);
        // Whenever the elevator is idle (has no more queued destinations) ...
        elevator.on("idle", function() {
            console.log("idle called" + elevator);
            setStop(elevator);
            if(elevator.getPressedFloors().length > 0) {
                var destFloorNum = elevator.getpressedFloors()[0];
                if (isDestUp(elevator, destFloorNum)) {
                    addDestination(elevator, destFloorNum, true);
                } else {
                    addDestination(elevator, destFloorNum, false);
                }
                return;
            }
            if(!isWaitingQueueEmpty()) {
                target = popWaitingQueue();
                addDestination(elevator, target.num, target.dir);
            }

        });
        elevator.on("floor_button_pressed", function(floorNum) {
            if(isStopped(elevator)) {
                if (isDestUp(elevator, floorNum)) {
                    addDestination(elevator, floorNum, true);    
                } else {
                    addDestination(elevator, floorNum, false);    
                }
            } else if(isInUpWay(elevator,floorNum)) {
                addDestination(elevator, floorNum, true);
            } else if(isInDownWay(elevator, floorNum)) {
                addDestination(elevator, floorNum, false);
            }
        });

        for(i=0;i < floors.length; i++) {
            var floor = floors[i];
            floor.on("up_button_pressed", function() {
                console.log("up_button pressed called" + elevator);
                if(isStopped(elevator) || isInUpWay(elevator, this.floorNum())) {
                    addDestination(elevator, this.floorNum(), true);
                } else {
                    addWaitingQueue(this.floorNum(), true);
                }
            });

            floor.on("down_button_pressed", function() {
                console.log("down_button pressed called" + elevator);
                if(isStopped(elevator) || isInDownWay(elevator, this.floorNum())) {
                    addDestination(elevator, this.floorNum(), false);
                } else {
                    addWaitingQueue(this.floorNum(), false);
                }
            });
        }
    },
        update: function(dt, elevators, floors) {
            // We normally don't need to do anything here
        }
}