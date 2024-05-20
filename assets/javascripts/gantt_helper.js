class GanttHelper {
  constructor(
    projectId,
    ganttElementId,
    ganttLayoutContentElement,
    resizerElement,
    motnElement,
    motnRangeElement,
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
    this.month = document.getElementById(motnElement);
    this.monthRange = document.getElementById(motnRangeElement);
    this.statusIds = document.getElementsByClassName(statusIdsElement);
    this.openAllBtnElement = document.getElementById(openAllBtn);
    this.closeAllBtnElement = document.getElementById(closeAllBtn);
  }

  setup() {
    this.initMonthFilter();
    this.attachOnChangeMonthChange();
    this.attachOnChangeMonthRangeChange();
    this.attachOnOpenAllTasks();
    this.attachOnCloseAllTasks();
    this.attachOnChangeStatus();

    // タスクのリサイズのステップを1日単位に設定
    this.gantt.config.duration_step = 1;
    // 日付を丸める設定
    this.gantt.config.round_dnd_dates = true;
    this.gantt.config.row_height = 24;
    this.createLightbox();
    this.setupLabel();
    this.setUpPriorityColors();
    this.attachOnTaskCreated();
    this.attachOnLightboxSave();
    this.getTrackers();
    this.getPriorities();
    this.setupProgressOptions();
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
  }

  createLightbox() {
    // カスタムライトボックスの設定
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

  setupLabel() {
    // ラベルの設定
    this.gantt.locale.labels.section_subject = "Subject";
    this.gantt.locale.labels.section_tracker = "Tracker";
    this.gantt.locale.labels.section_priority = "Priority";
    this.gantt.locale.labels.section_status = "Status";
    this.gantt.locale.labels.section_progress = "Progress";
  }

  setUpPriorityColors() {
    this.gantt.templates.task_class = function (start, end, task) {
      // console.log(task);
      if (task.priority == "High") {
        return "high-priority";
      } else if (task.priority == "Urgent") {
        return "urgent-priority";
      } else if (task.priority == "Immediate") {
        return "immediate-priority";
      }
      return "";
    };
  }

  attachOnTaskCreated() {
    // 新しいタスクを追加するためのイベントリスナー
    this.gantt.attachEvent("onTaskCreated", (task) => {
      task.text = "";
      task.description = "";
      task.tracker_id = 1;
      task.priority_id = 5;
      task.status_id = 1;
      task.progress = 0;
      return true;
    });
  }

  attachOnLightboxSave() {
    // タイトルを編集できるようにするためのイベントリスナー
    this.gantt.attachEvent("onLightboxSave", (id, item, isNew) => {
      // console.log("item", item);
      // console.log("this.gantt.getTask(id)", this.gantt.getTask(id));

      this.gantt.getTask(id).text = item.text;
      this.gantt.getTask(id).description = item.description; // descriptionプロパティを保存
      this.gantt.getTask(id).tracker_id = item.tracker_id;
      this.gantt.getTask(id).priority_id = item.priority_id;
      this.gantt.getTask(id).status_id = item.status_id;
      this.gantt.getTask(id).progress = item.progress;
      return true;
    });
  }

  failureCallback = (error) => {
    alert(error);
  };

  getTrackers() {
    // トラッカーフィールドのオプションを設定
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
    // 優先度フィールドのオプションを設定
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

  setupProgressOptions() {
    // Progressフィールドのオプションを設定
    const progressOptions = [];
    for (let i = 0; i <= 10; i++) {
      progressOptions.push({ key: i / 10, label: i * 10 + "%" });
    }
    this.gantt.config.lightbox.sections.forEach((section) => {
      if (section.name === "progress") {
        section.options = progressOptions;
      }
    });
  }

  getStatus() {
    // Statusフィールドのオプションを設定
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
    // Taskの取得
    const successCallback = (data) => {
      gantt.clearAll();
      this.gantt.parse(data);
      // グリッド幅を計算
      // Ganttの初期化前に設定を適用
      this.calculateGridWidth(this.gantt, data);
      gantt.render();
    };
    const selectedMonth = this.month.value;
    const selectedMonthRange = this.monthRange.value;
    const statusCheckboxes = document.querySelectorAll(
      'input[name="status_ids[]"]:checked',
    ); // 選択されたチェックボックスを取得
    const selectedStatusIds = Array.from(statusCheckboxes).map(
      (checkbox) => checkbox.value,
    ); // チェックボックスの値を配列として取得

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

  // Events
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
        /* console.log(data); */
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
    this.gantt.attachEvent("onAfterTaskDelete", (id, task) => {
      const successCallback = (data) => {
        /* console.log(data); */
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
      const successCallback = (data) => {
        // console.log(data);
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
      const successCallback = (response) => {
        // console.log(response);
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
      this.resizer.style.left = startWidth + e.clientX - startX + 16 + "px";
      this.gantt.config.grid_width = startWidth + e.clientX - startX;
      this.ganttGrid.style.width = startWidth + e.clientX - startX + "px";
    };

    const stopDrag = () => {
      document.documentElement.removeEventListener("mousemove", doDrag, false);
      document.documentElement.removeEventListener("mouseup", stopDrag, false);
      this.gantt.render();
    };
  }

  // 現在の月を取得し、月入力フィールドに設定する
  initMonthFilter() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, "0"); // 月を2桁に
    this.month.value = `${year}-${month}`;
    this.monthRange.value = 3;
  }

  attachOnChangeMonthChange() {
    const helper = this;
    this.month.addEventListener("change", (e) => {
      helper.loadTasks();
    });
  }

  attachOnChangeMonthRangeChange() {
    const helper = this;
    this.monthRange.addEventListener("change", (e) => {
      helper.loadTasks();
    });
  }

  attachOnOpenAllTasks() {
    const helper = this;
    this.openAllBtnElement.addEventListener("click", (e) => {
      helper.gantt.eachTask(function (task) {
        task.$open = true;
      });
      helper.gantt.render();
    });
  }

  attachOnCloseAllTasks() {
    const helper = this;
    this.closeAllBtnElement.addEventListener("click", (e) => {
      helper.gantt.eachTask(function (task) {
        task.$open = false;
      });
      helper.gantt.render();
    });
  }

  attachOnChangeStatus() {
    const helper = this;
    for (let i = 0; i < this.statusIds.length; i++) {
      this.statusIds[i].addEventListener("change", function () {
        helper.loadTasks(); // チェックボックスの状態が変わったときに呼び出される
      });
    }
  }

  // テキストの長さに基づいてグリッド幅を設定する関数
  calculateGridWidth(gantt, tasks) {
    let maxTextLength = 0;
    tasks.data.forEach((task) => {
      if (task.text.length > maxTextLength) {
        maxTextLength = task.text.length;
      }
    });

    // 1文字あたりのピクセル数（仮定）
    const pixelsPerChar = 11; // 余白を追加
    const space = 0; // 余白を追加
    const idWidth = 4 * pixelsPerChar + space;
    const textWidth = maxTextLength * pixelsPerChar + space;
    const startDateWidth = 8 * pixelsPerChar + space;
    const endDateWidth = 8 * pixelsPerChar + space;
    const durationWidth = 3 * pixelsPerChar + space;
    const progressWidth = 3 * pixelsPerChar + space;

    // カスタム列
    gantt.config.columns = [
      {
        name: "id",
        label: "Id",
        align: "center",
        width: idWidth,
      },
      {
        name: "text",
        label: "Task name",
        width: textWidth,
        tree: true,
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
      {
        name: "add",
        label: "",
        width: 44,
        align: "center",
      },
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
