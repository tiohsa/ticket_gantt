class TicketGanttHelper {
  // 数値を10の倍数に丸める
  roundToNearestTen(num) {
    return Math.round(num / 10) * 10;
  }

  // フェッチのレスポンスをチェックし、エラーメッセージを処理する
  checkResponse(response) {
    if (!response.ok) {
      return response.json().then((error) => {
        let errorMessage = error.message || "Unknown error occurred.";
        if (error.errors) {
          errorMessage += "\n" + error.errors.join("\n");
        }
        throw new Error(errorMessage);
      });
    } else {
      return response.json();
    }
  }

  // 指定されたプロジェクトIDのタスクを取得する
  getTasks(
    projectId,
    selectedMonth,
    selectedRangeMonth,
    successCallback,
    failureCallback,
  ) {
    const url = `/projects/${projectId}/ticket_gantts?month=${selectedMonth}&month_range=${selectedRangeMonth}`;
    fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) => this.checkResponse(response))
      .then((data) => successCallback(data))
      .catch((error) => failureCallback(error));
  }

  // トラッカー情報を取得する
  getTrackers(successCallback, failureCallback) {
    const url = `/trackers.json`;
    fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) => this.checkResponse(response))
      .then((data) => successCallback(data))
      .catch((error) => failureCallback(error));
  }

  // プライオリティ情報を取得する
  getPriorities(successCallback, failureCallback) {
    const url = `/priorities`;
    fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) => this.checkResponse(response))
      .then((data) => successCallback(data))
      .catch((error) => failureCallback(error));
  }

  // ステータス情報を取得する
  getStatus(successCallback, failureCallback) {
    const url = `/issue_statuses.json`;
    fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) => this.checkResponse(response))
      .then((data) => successCallback(data))
      .catch((error) => failureCallback(error));
  }

  // チケットを追加する
  addTicket(projectId, task, successCallback, failureCallback) {
    fetch(`/projects/${projectId}/ticket_gantts/add_ticket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": document
          .querySelector('meta[name="csrf-token"]')
          .getAttribute("content"),
      },
      body: JSON.stringify({
        issue: {
          subject: task.text,
          description: task.description,
          tracker_id: task.tracker,
          priority_id: task.priority,
          status_id: task.status,
          done_ratio: this.roundToNearestTen(task.progress * 100),
          start_date: task.start_date.toLocaleDateString(),
          due_date: task.end_date.toLocaleDateString(),
          parent_id: task.parent,
        },
      }),
    })
      .then((response) => this.checkResponse(response))
      .then((data) => successCallback(data))
      .catch((error) => failureCallback(error));
  }

  // チケットを更新する
  updateTicket(projectId, ticketId, task, successCallback, failureCallback) {
    fetch(`/projects/${projectId}/ticket_gantts/${ticketId}/update_ticket`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": document
          .querySelector('meta[name="csrf-token"]')
          .getAttribute("content"),
      },
      body: JSON.stringify({
        issue: {
          id: task.id,
          subject: task.text,
          description: task.description,
          tracker_id: task.tracker,
          priority_id: task.priority,
          status_id: task.status,
          done_ratio: this.roundToNearestTen(task.progress * 100),
          start_date: task.start_date.toLocaleDateString(),
          due_date: task.end_date.toLocaleDateString(),
          parent_id: task.parent,
        },
      }),
    })
      .then((response) => this.checkResponse(response))
      .then((data) => successCallback(data))
      .catch((error) => failureCallback(error));
  }

  // チケットを削除する
  deleteTicket(projectId, ticketId, successCallback, failureCallback) {
    fetch(`/projects/${projectId}/ticket_gantts/${ticketId}/delete_ticket`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": document
          .querySelector('meta[name="csrf-token"]')
          .getAttribute("content"),
      },
    })
      .then((response) => this.checkResponse(response))
      .then((data) => successCallback(data))
      .catch((error) => failureCallback(error));
  }

  // チケットの関係を追加する
  addTicketRelation(projectId, link, successCallback, failureCallback) {
    fetch(`/projects/${projectId}/ticket_gantts/add_relation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": document
          .querySelector('meta[name="csrf-token"]')
          .getAttribute("content"),
      },
      body: JSON.stringify({
        relation: {
          id: link.id,
          source: link.source,
          target: link.target,
          type: link.type,
        },
      }),
    })
      .then((response) => this.checkResponse(response))
      .then((data) => successCallback(data))
      .catch((error) => failureCallback(error));
  }

  // チケットの関係を更新する
  updateTicketRelation(projectId, link, successCallback, failureCallback) {
    fetch(`/projects/${projectId}/ticket_gantts/${link.id}/update_relation`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": document
          .querySelector('meta[name="csrf-token"]')
          .getAttribute("content"),
      },
      body: JSON.stringify({
        relation: {
          id: link.id,
          source: link.source,
          target: link.target,
          type: link.type,
        },
      }),
    })
      .then((response) => this.checkResponse(response))
      .then((data) => successCallback(data))
      .catch((error) => failureCallback(error));
  }

  // チケットの関係を削除する
  deleteTicketRelation(projectId, link, successCallback, failureCallback) {
    fetch(`/projects/${projectId}/ticket_gantts/${link.id}/delete_relation`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": document
          .querySelector('meta[name="csrf-token"]')
          .getAttribute("content"),
      },
      body: JSON.stringify({
        relation: {
          id: link.id,
        },
      }),
    })
      .then((response) => this.checkResponse(response))
      .then((data) => successCallback(data))
      .catch((error) => failureCallback(error));
  }
}