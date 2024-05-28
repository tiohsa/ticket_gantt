class GanttHelper {
  constructor(options) {
    this.projectId = options.projectId;
    this.gantt = gantt;
    this.ganttElementId = options.ganttElementId;
    this.ticketGanttHelper = new TicketGanttHelper();
    this.ganttLayoutContentElement = options.ganttLayoutContentElement;
    this.resizer = document.querySelector(options.resizerElement);
    this.month = document.getElementById(options.monthElement);
    this.monthRange = document.getElementById(options.monthRangeElement);
    this.statusIds = document.getElementsByClassName(options.statusIdsElement);
    this.openAllButtonElement = document.getElementById(options.openAllButton);
    this.closeAllButtonElement = document.getElementById(
      options.closeAllButton,
    );
    this.viewRangeElement = document.getElementById(options.viewRangeElement);
    this.ganttHeightElement = document.getElementById(
      options.ganttHeightElement,
    );
    this.fullscreenButtonElement = document.getElementById(
      options.fullscreenButtonElement,
    );
  }

  setUp() {
    this.initMonthFilter();
    // config
    this.setUpConfig();

    this.attachOnChangeMonthChange();
    this.attachOnChangeMonthRangeChange();
    this.attachOnOpenAllTasks();
    this.attachOnCloseAllTasks();
    this.attachOnChangeStatus();
    this.createLightbox();
    this.setUpLabel();
    this.attachOnTaskCreated();
    this.attachOnLightboxSave();
    this.getTrackers();
    this.getPriorities();
    this.setUpProgressOptions();
    this.getStatus();
    this.loadTasks();
    this.attachOnChangeViewRange();
    this.attachOnChangeGanttHeight();
    this.attachOnAfterTaskAdd();
    this.attachOnAfterTaskUpdate();
    this.attachOnAfterTaskDelete();
    this.attachOnAfterLinkAdd();
    this.attachOnAfterLinkUpdate();
    this.attachOnAfterLinkDelete();
    this.attachOnGanttRender();
    this.attachResizer();
    // this.setUpMouseScroll();
    this.attachFullScreenButton();
  }

  setUpConfig() {
    this.gantt.config.duration_step = 1;
    this.gantt.config.round_dnd_dates = true;
    this.gantt.config.row_height = 24;

    // マウスドラッグによるスクロールを有効にする
    this.gantt.config.touch = "force";
    this.gantt.config.scroll_on_click = true;
    this.gantt.config.autoscroll = true;

    gantt.config.scale_unit = "month";
    gantt.config.date_scale = "%d %M";
    gantt.config.subscales = [{ unit: "day", step: 1, date: "%d %M" }];
    this.gantt.config.time_step = 1440;

    const yearMonth = this.month.value.split("-");
    const range = parseInt(this.monthRange.value);
    var startDate = new Date(
      parseInt(yearMonth[0]),
      parseInt(yearMonth[1]) - 1,
      1,
    );
    var endDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + range,
      0,
    );
    // Ganttチャートの表示範囲を設定
    this.gantt.config.start_date = startDate;
    this.gantt.config.end_date = endDate;

    this.gantt.plugins({
      marker: true,
      click_drag: true,
      multiselect: true,
      drag_timeline: true,
      fullscreen: true,
      // quick_info: true,
      tooltip: true,
    });
    this.gantt.init(this.ganttElementId);
    this.ganttGrid = document.querySelector(this.ganttLayoutContentElement);
  }

  setUpMarder() {
    var dateToStr = this.gantt.date.date_to_str(gantt.config.task_date);
    this.gantt.addMarker({
      start_date: new Date(), //a Date object that sets the marker's date
      css: "today", //a CSS class applied to the marker
      text: "Now", //the marker title
      title: dateToStr(new Date()), // the marker's tooltip
    });
  }

  attachFullScreenButton() {
    this.fullscreenButtonElement.addEventListener(
      "click",
      function () {
        if (!gantt.getState().fullscreen) {
          // expanding the gantt to full screen
          gantt.expand();
        } else {
          // collapsing the gantt to the normal mode
          gantt.collapse();
        }
      },
      false,
    );
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
      {
        name: "milestone",
        type: "checkbox",
        map_to: "milestone",
        options: [{ key: 1, label: "Yes" }],
      },
    ];
  }

  setUpLabel() {
    this.gantt.locale.labels.section_subject = "Subject";
    this.gantt.locale.labels.section_tracker = "Tracker";
    this.gantt.locale.labels.section_priority = "Priority";
    this.gantt.locale.labels.section_status = "Status";
    this.gantt.locale.labels.section_progress = "Progress";
    this.gantt.locale.labels.section_milestone = "Milestone";
  }

  setUpTooltip() {
    this.gantt.templates.tooltip_text = function (start, end, task) {
      return (
        "<b>Task:</b> " + task.text + "<br/><b>Duration:</b> " + task.duration
      );
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
      task.milestone = ["0"];
      task.lock_version = null;
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
      task.milestone = item.milestone;
      task.lock_version = item.lock_version;
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
      this.setUpMarder();
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

  attachOnChangeViewRange() {
    this.viewRangeElement.addEventListener("change", function () {
      var value = this.value;
      switch (value) {
        case "day":
          gantt.config.scale_unit = "month";
          gantt.config.date_scale = "%d %M";
          gantt.config.subscales = [{ unit: "day", step: 1, date: "%d %M" }];
          break;
        case "week":
          gantt.config.scale_unit = "week";
          gantt.config.date_scale = "Week #%W";
          gantt.config.subscales = [{ unit: "day", step: 1, date: "%d %M" }];
          break;
        case "month":
          gantt.config.scale_unit = "month";
          gantt.config.date_scale = "%F";
          gantt.config.subscales = [
            { unit: "week", step: 1, date: "Week #%W" },
          ];
          break;
        case "year":
          gantt.config.scale_unit = "year";
          gantt.config.date_scale = "%Y";
          gantt.config.subscales = [{ unit: "month", step: 1, date: "%F" }];
          break;
        default:
          gantt.config.scale_unit = value; // デフォルトは変更なし
          gantt.config.date_scale = "%d %M"; // もしくはデフォルトのスケール設定
          gantt.config.subscales = []; // サブスケールのデフォルト設定を空に
      }
      gantt.render();
    });
  }

  attachOnChangeGanttHeight() {
    this.ganttHeightElement.addEventListener("change", function () {
      var height = this.value + "px";
      document.getElementById("gantt_here").style.height = height;
      this.gantt.resize();
    });
  }

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
      const successCallback = (data) => {
        var task = this.gantt.getTask(id);
        task.lock_version = data.ticket.lock_version;
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
    this.gantt.attachEvent("onAfterLinkDelete", (id, link) => {
      const successCallback = () => {
        // Link deleted successfully
      };
      this.ticketGanttHelper.deleteTicketRelation(
        this.projectId,
        link,
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
    this.openAllButtonElement.addEventListener("click", () => {
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
    this.closeAllButtonElement.addEventListener("click", () => {
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
      {
        name: "text",
        label: "Task name",
        width: textWidth,
        tree: true,
        template: function (task) {
          if (task.is_closed) {
            return "<span class='closed-task'>" + task.text + "</span>";
          }
          return task.text;
        },
      },
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
    // タスクテキストのカスタマイズ
    this.gantt.templates.task_text = function (start, end, task) {
      return Math.floor((task.progress * 100) / 10) * 10 + "%";
    };

    this.gantt.templates.task_class = function (start, end, task) {
      var css = "";
      if (task.milestone[0] == "1") {
        return " milestone";
      } else if (task.progress < 0.3) {
        css += " low-progress"; // 進捗率が30%未満の場合
      } else if (task.progress < 0.7) {
        css += " medium-progress"; // 進捗率が30%以上70%未満の場合
      } else if (task.progress >= 0.7) {
        css += " high-progress"; // 進捗率が70%以上の場合
      }
      return css;
    };

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
