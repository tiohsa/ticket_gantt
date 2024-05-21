class GanttHelper {
  constructor(
    projectId,
    ganttElementId,
    ganttLayoutContentElement,
    resizerElement,
    monthElement,
    monthRangeElement,
    statusIdsElement,
    openAllBtn,
    closeAllBtn,
  ) {
    this.projectId = projectId;
    this.gantt = gantt;
    this.gantt.init(ganttElementId);
    this.ticketGanttHelper = new TicketGanttHelper();
    this.ganttGrid = document.querySelector(ganttLayoutContentElement);
    this.resizer = document.querySelector(resizerElement);
    this.month = document.getElementById(monthElement);
    this.monthRange = document.getElementById(monthRangeElement);
    this.statusIds = document.getElementsByClassName(statusIdsElement);
    this.openAllBtnElement = document.getElementById(openAllBtn);
    this.closeAllBtnElement = document.getElementById(closeAllBtn);
  }

  setUp() {
    this.initMonthFilter();
    this.attachOnChangeMonthChange();
    this.attachOnChangeMonthRangeChange();
    this.attachOnOpenAllTasks();
    this.attachOnCloseAllTasks();
    this.attachOnChangeStatus();

    this.gantt.config.duration_step = 1;
    this.gantt.config.round_dnd_dates = true;
    this.gantt.config.row_height = 24;

    // マウスドラッグによるスクロールを有効にする
    this.gantt.config.touch = "force";
    // マウスホイールによる水平スクロールを有効にする
    this.gantt.config.scroll_on_click = true;
    this.gantt.config.autoscroll = true;

    this.createLightbox();
    this.setUpLabel();
    this.setUpPriorityColors();
    this.attachOnTaskCreated();
    this.attachOnLightboxSave();
    this.getTrackers();
    this.getPriorities();
    this.setUpProgressOptions();
    this.getStatus();
    this.loadTasks();
    this.attachOnAfterTaskAdd();
    this.attachOnAfterTaskUpdate();
    this.attachOnAfterTaskDelete();
    this.attachOnAfterLinkAdd();
    this.attachOnAfterLinkUpdate();
    this.attachOnAfterLinkDelete();
    this.attachOnGanttRender();
    this.attachResizer();
    // this.setUpMouseScroll();
  }

  createLightbox() {
    this.gantt.config.lightbox.sections = [
      {
        name: "subject",
        height: 24,
        map_to: "text",
        type: "textarea",
        focus: true,
      },
      {
        name: "description",
        height: 48,
        map_to: "description",
        type: "textarea",
      },
      {
        name: "tracker",
        height: 30,
        map_to: "tracker_id",
        type: "select",
        options: [],
      },
      {
        name: "priority",
        height: 30,
        map_to: "priority_id",
        type: "select",
        options: [],
      },
      {
        name: "status",
        height: 30,
        map_to: "status_id",
        type: "select",
        options: [],
      },
      {
        name: "progress",
        height: 30,
        map_to: "progress",
        type: "select",
        options: [],
      },
      { name: "time", type: "duration", map_to: "auto" },
    ];
  }

  setUpLabel() {
    this.gantt.locale.labels.section_subject = "Subject";
    this.gantt.locale.labels.section_tracker = "Tracker";
    this.gantt.locale.labels.section_priority = "Priority";
    this.gantt.locale.labels.section_status = "Status";
    this.gantt.locale.labels.section_progress = "Progress";
  }

  setUpPriorityColors() {
    this.gantt.templates.task_class = function (start, end, task) {
      if (task.priority === "High") {
        return "high-priority";
      } else if (task.priority === "Urgent") {
        return "urgent-priority";
      } else if (task.priority === "Immediate") {
        return "immediate-priority";
      }
      return "";
    };
  }

  setUpMouseScroll() {
    let isScrolling = false;

    // マウスホイールでスクロールするための設定
    this.gantt.attachEvent("onGanttScroll", (left, top) => {
      if (!isScrolling) {
        isScrolling = true;
        setTimeout(() => {
          this.gantt.scrollTo(left, top);
          isScrolling = false;
        }, 0);
      }
    });

    // カスタムドラッグスクロールイベント
    this.gantt.attachEvent("onMouseDown", (event) => {
      const mouseDownX = event.clientX;
      const mouseDownY = event.clientY;
      const initialScrollLeft = this.gantt.scrollLeft;
      const initialScrollTop = this.gantt.scrollTop;

      const onMouseMove = (e) => {
        const diffX = mouseDownX - e.clientX;
        const diffY = mouseDownY - e.clientY;
        this.gantt.scrollTo(
          initialScrollLeft + diffX,
          initialScrollTop + diffY,
        );
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
  }

  attachOnTaskCreated() {
    this.gantt.attachEvent("onTaskCreated", (task) => {
      task.text = "";
      task.description = "";
      task.tracker_id = 4; //タスク
      task.priority_id = 2; //通常
      task.status_id = 1; //新規
      task.progress = 0;
      const today = new Date();
      task.start_date = today;
      task.end_date = this.gantt.calculateEndDate({
        start_date: today,
        duration: 1,
      });
      return true;
    });
  }

  attachOnLightboxSave() {
    this.gantt.attachEvent("onLightboxSave", (id, item) => {
      const task = this.gantt.getTask(id);
      task.text = item.text;
      task.description = item.description;
      task.tracker_id = item.tracker_id;
      task.priority_id = item.priority_id;
      task.status_id = item.status_id;
      task.progress = item.progress;
      return true;
    });
  }

  failureCallback = (error) => {
    alert(error);
  };

  getTrackers() {
    const successCallback = (data) => {
      const options = data.trackers.map((tracker) => {
        return { key: tracker.id, label: tracker.name };
      });
      this.gantt.config.lightbox.sections.forEach((section) => {
        if (section.name === "tracker") {
          section.options = options;
        }
      });
    };
    this.ticketGanttHelper.getTrackers(successCallback, this.failureCallback);
  }

  getPriorities() {
    const successCallback = (data) => {
      const options = data.priorities.map((priority) => {
        return { key: priority.id, label: priority.name };
      });
      this.gantt.config.lightbox.sections.forEach((section) => {
        if (section.name === "priority") {
          section.options = options;
        }
      });
    };
    this.ticketGanttHelper.getPriorities(successCallback, this.failureCallback);
  }

  setUpProgressOptions() {
    const progressOptions = Array.from({ length: 11 }, (_, i) => ({
      key: i / 10,
      label: i * 10 + "%",
    }));
    this.gantt.config.lightbox.sections.forEach((section) => {
      if (section.name === "progress") {
        section.options = progressOptions;
      }
    });
  }

  getStatus() {
    const successCallback = (data) => {
      const options = data.statuses.map((status) => {
        return { key: status.id, label: status.name };
      });
      this.gantt.config.lightbox.sections.forEach((section) => {
        if (section.name === "status") {
          section.options = options;
        }
      });
    };
    this.ticketGanttHelper.getStatus(successCallback, this.failureCallback);
  }

  loadTasks() {
    const successCallback = (data) => {
      this.gantt.clearAll();
      this.gantt.parse(data);
      this.calculateGridWidth(this.gantt, data);
      this.openAllTasks();
      this.gantt.render();
    };

    const selectedMonth = this.month.value;
    const selectedMonthRange = this.monthRange.value;
    const statusCheckboxes = Array.from(
      document.querySelectorAll('input[name="status_ids[]"]:checked'),
    );
    const selectedStatusIds = statusCheckboxes.map(
      (checkbox) => checkbox.value,
    );

    this.ticketGanttHelper.getTasks(
      this.projectId,
      selectedMonth,
      selectedMonthRange,
      selectedStatusIds,
      successCallback,
      this.failureCallback,
    );
  }

  eventFailureCallback = (error) => {
    alert(error);
    this.loadTasks();
  };

  attachOnAfterTaskAdd() {
    this.gantt.attachEvent("onAfterTaskAdd", (id, task) => {
      const successCallback = (data) => {
        this.gantt.changeTaskId(id, data.ticket.id);
      };
      this.ticketGanttHelper.addTicket(
        this.projectId,
        task,
        successCallback,
        this.eventFailureCallback,
      );
    });
  }

  attachOnAfterTaskUpdate() {
    this.gantt.attachEvent("onAfterTaskUpdate", (id, task) => {
      const successCallback = () => {
        this.gantt.render();
      };
      this.ticketGanttHelper.updateTicket(
        this.projectId,
        id,
        task,
        successCallback,
        this.eventFailureCallback,
      );
    });
  }

  attachOnAfterTaskDelete() {
    this.gantt.attachEvent("onAfterTaskDelete", (id) => {
      const successCallback = () => {
        // Task deleted
      };
      this.ticketGanttHelper.deleteTicket(
        this.projectId,
        id,
        successCallback,
        this.eventFailureCallback,
      );
    });
  }

  attachOnAfterLinkAdd() {
    this.gantt.attachEvent("onAfterLinkAdd", (id, link) => {
      const successCallback = (data) => {
        this.gantt.changeLinkId(id, data.relation.id);
      };
      this.ticketGanttHelper.addTicketRelation(
        this.projectId,
        link,
        successCallback,
        this.eventFailureCallback,
      );
    });
  }

  attachOnAfterLinkUpdate() {
    this.gantt.attachEvent("onAfterLinkUpdate", (id, link) => {
      const successCallback = () => {
        // Link updated successfully
      };
      this.ticketGanttHelper.updateTicketRelation(
        this.projectId,
        link,
        successCallback,
        this.eventFailureCallback,
      );
    });
  }

  attachOnAfterLinkDelete() {
    this.gantt.attachEvent("onAfterLinkDelete", (id) => {
      const successCallback = () => {
        // Link deleted successfully
      };
      this.ticketGanttHelper.deleteTicketRelation(
        this.projectId,
        id,
        successCallback,
        this.eventFailureCallback,
      );
    });
  }

  attachOnGanttRender() {
    this.gantt.attachEvent("onGanttRender", () => {
      const rect = this.ganttGrid.getBoundingClientRect();
      this.resizer.style.left = rect.width + 16 + "px";
      this.resizer.style.height = rect.height + "px";
    });
  }

  attachResizer() {
    let startX;
    let startWidth;

    this.resizer.addEventListener("mousedown", (e) => {
      startX = e.clientX;
      startWidth = parseInt(
        document.defaultView.getComputedStyle(this.ganttGrid).width,
        10,
      );
      document.documentElement.addEventListener("mousemove", doDrag, false);
      document.documentElement.addEventListener("mouseup", stopDrag, false);
    });

    const doDrag = (e) => {
      const newWidth = startWidth + e.clientX - startX;
      this.resizer.style.left = newWidth + 16 + "px";
      this.gantt.config.grid_width = newWidth;
      this.ganttGrid.style.width = newWidth + "px";
    };

    const stopDrag = () => {
      document.documentElement.removeEventListener("mousemove", doDrag, false);
      document.documentElement.removeEventListener("mouseup", stopDrag, false);
      this.gantt.render();
    };
  }

  initMonthFilter() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
    this.month.value = `${year}-${month}`;
    this.monthRange.value = 3;
  }

  attachOnChangeMonthChange() {
    this.month.addEventListener("change", () => {
      this.loadTasks();
    });
  }

  attachOnChangeMonthRangeChange() {
    this.monthRange.addEventListener("change", () => {
      this.loadTasks();
    });
  }

  attachOnOpenAllTasks() {
    this.openAllBtnElement.addEventListener("click", () => {
      this.openAllTasks();
      this.gantt.render();
    });
  }

  openAllTasks() {
    this.gantt.eachTask((task) => {
      task.$open = true;
    });
  }

  attachOnCloseAllTasks() {
    this.closeAllBtnElement.addEventListener("click", () => {
      this.gantt.eachTask((task) => {
        task.$open = false;
      });
      this.gantt.render();
    });
  }

  attachOnChangeStatus() {
    Array.from(this.statusIds).forEach((statusId) => {
      statusId.addEventListener("change", () => {
        this.loadTasks();
      });
    });
  }

  calculateGridWidth(gantt, tasks) {
    let maxTextLength = tasks.data.reduce(
      (max, task) => Math.max(max, task.text.length),
      0,
    );
    const pixelsPerChar = 11;
    const space = 0;

    const idWidth = 4 * pixelsPerChar + space;
    const textWidth = maxTextLength * pixelsPerChar + space;
    const startDateWidth = 8 * pixelsPerChar + space;
    const endDateWidth = 8 * pixelsPerChar + space;
    const durationWidth = 3 * pixelsPerChar + space;
    const progressWidth = 3 * pixelsPerChar + space;

    gantt.config.columns = [
      { name: "id", label: "Id", align: "center", width: idWidth },
      { name: "text", label: "Task name", width: textWidth, tree: true },
      {
        name: "start_date",
        label: "Start time",
        align: "center",
        width: startDateWidth,
      },
      {
        name: "end_date",
        label: "End date",
        align: "center",
        width: endDateWidth,
      },
      {
        name: "duration",
        label: "Duration",
        resize: true,
        width: durationWidth,
      },
      {
        name: "progress",
        label: "Progress",
        align: "center",
        resize: true,
        width: progressWidth,
      },
      { name: "add", label: "", width: 44, align: "center" },
    ];

    const gridWidth =
      idWidth +
      textWidth +
      startDateWidth +
      endDateWidth +
      durationWidth +
      progressWidth;
    gantt.config.grid_width = gridWidth;
  }
}
