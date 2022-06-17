let KanbanTest = null;
let selectedPipeline = null;
let workflowCount = 0;
window.onload = function () {
  loadEditor();
  default_text = editor.getValue();

  // Parse the YAML in the text editor
  loadYaml(parseYaml());

  editor.getModel().onDidChangeContent((event) => {
    removeAllBoards();
    
    loadYaml(parseYaml());
  });

  var pipelinesElm = document.getElementById("pipelines");
  pipelinesElm.addEventListener("change", function() {
    updateYamlFromBoard();
    selectedPipeline = this.value;
    removeAllBoards();
    loadYaml(parseYaml());
  });

  var downloadElm = document.getElementById("download");
  downloadElm.addEventListener("click", function() {
    download();
  });

  var addStageElm = document.getElementById("addStage");
  addStageElm.addEventListener("click", function() {
    let stage = document.getElementById('stage_name').value;
    if(stage == ''){
      alert('Error: You must enter a stage name!');
    } else if(!isUniqueStageNameForBoard(stage)) {
      alert('Error: Stage "'+stage+'" already exists in this Pipeline!');
    }  else {
      let yamlObj = parseYaml();
      let items = [];
      if(yamlObj.stages[stage]){
        yamlObj.stages[stage].workflows.forEach((workflowObj, index)=>{
          let workflow = Object.keys(workflowObj)[0];
          let workflow_id = workflow + '|' + stage + '_' + index;
          items.push({
            id: workflow_id,
            title: '<div class="workflow-title">'+workflow + '</div><div class="workflow-delete"><input id="delete_'+workflow_id+'" class="delete" type="button" value="X" onclick="deleteWorkflow(\''+workflow_id+'\')"></div>'
          });
        });
      }
      KanbanTest.addBoards([
        {
          id: stage,
          title: stage + '<input id="delete_'+stage+'" class="delete" type="button" value="X" onclick="deleteStage(\''+stage+'\')">',
          item: items,
          class: "white"
        }
      ]);
      let boardObj = renderJSON();
      KanbanTest.options.boards.forEach((board)=>{
          board.dragTo = boardObj.map((board)=>board.id)
      });

      updateYamlFromBoard();
      document.getElementById('stage_name').value = '';
    }
  });

  var addPipelineElm = document.getElementById("addPipeline");
  addPipelineElm.addEventListener("click", function() {
    let name = document.getElementById('pipeline_name').value;
    if(name == ''){
      alert('Error: You must enter a pipeline name!');
    } else if(!isUniquePipelineName(name)) {
      alert('Error: You must enter a unique pipeline name!');
    } else {
      selectedPipeline = name;
      removeAllBoards();
      updateYamlFromBoard(name);
      loadYaml(parseYaml());
      document.getElementById('pipeline_name').value = '';
    }
  });
};

function loadYaml(yamlObj){
    let pipeline_keys = yamlObj.pipelines ? Object.keys(yamlObj.pipelines) : [];
    if(!selectedPipeline || pipeline_keys.indexOf(selectedPipeline) == -1){
      selectedPipeline = pipeline_keys[0];
    }
    let stage_keys = yamlObj.stages ? Object.keys(yamlObj.stages) : [];

    let selectHTML = '';
    pipeline_keys.forEach((pipeline)=>{
        selectHTML += '<option value="'+pipeline+'" '+(pipeline == selectedPipeline ? 'selected' : '')+'>'+pipeline+'</option>';
    });
    document.getElementById('pipelines').innerHTML = selectHTML;

    let boards = [];
    pipeline_keys.forEach((pipelineKey)=>{
      let pipeline = yamlObj.pipelines[pipelineKey];
      if(selectedPipeline == pipelineKey){
        let pipeline_stage_keys = pipeline.stages.map((stage)=>Object.keys(stage)[0]);
        pipeline_stage_keys.forEach((stage)=>{
            let stageObj = yamlObj.stages[stage];
            let pipeline_stage_workflows = stageObj.workflows;
            let pipeline_stage_workflows_keys = pipeline_stage_workflows.map((stage)=>Object.keys(stage)[0]);
            let board_stages = [];
            pipeline_stage_workflows_keys.forEach((workflow, index)=>{
              let workflow_id = workflow + '|' + stage + '_' + index;
                board_stages.push({
                    id: workflow_id,
                    title: '<div class="workflow-title">'+workflow + '</div><div class="workflow-delete"><input id="delete_'+workflow_id+'" class="delete" type="button" value="X" onclick="deleteWorkflow(\''+workflow_id+'\')"></div>',
                    drag: function(el, source) {
                        console.log("START DRAG: " + el.dataset.eid);
                    },
                    dragend: function(el) {
                        console.log("END DRAG: " + el.dataset.eid);
                    },
                    drop: function(el) {
                        console.log("DROPPED: " + el.dataset.eid);
                        updateYamlFromBoard();
                    }
                });
            });
            boards.push({
                id: stage,
                title: stage + '<input id="delete_'+stage+'" class="delete" type="button" value="X" onclick="deleteStage(\''+stage+'\')">',
                class: "white",
                dragTo: stage_keys,
                item: board_stages
            }); 
        });
      }
    })
    createBoard(boards, yamlObj);
}

/* Board Event Handlers */

function deleteStage(board){
    KanbanTest.removeBoard(board);
    updateYamlFromBoard();
}

function deleteWorkflow(workflow){
  KanbanTest.removeElement(workflow);
  updateYamlFromBoard();
}

function addWorkflow(boardId, selectHTML){
  // create a form to enter element
  var formItem = document.createElement("form");
  formItem.setAttribute("class", "itemform");
  formItem.innerHTML =
    `<div class="form-group">
        ${selectHTML}
    </div>
    <div class="form-group">
        <button type="submit" class="bitriseButtonSmall">Add</button>
        <button type="button" id="CancelBtn" class="bitriseButtonSmall">Cancel</button>
    </div>`;

  KanbanTest.addForm(boardId, formItem);

  formItem.addEventListener("submit", function(e) {
    e.preventDefault();
    let yamlObj = parseYaml();
    let workflowCount = 0;
    if(yamlObj.stages[boardId]){
      workflowCount = yamlObj.stages[boardId].workflows.length;
    }
    var workflow = e.target[0].value;
    let workflow_id = workflow + '|' + boardId + '_' + workflowCount;
    KanbanTest.addElement(boardId, {
      id: workflow_id,
      title: '<div class="workflow-title">'+workflow + '</div><div class="workflow-delete"><input id="delete_'+workflow_id+'" class="delete" type="button" value="X" onclick="deleteWorkflow(\''+workflow_id+'\')"></div>',
    });
    formItem.parentNode.removeChild(formItem);
    updateYamlFromBoard();
  });
  document.getElementById("CancelBtn").onclick = function() {
    formItem.parentNode.removeChild(formItem);
  };
}

function createBoard(boards, yamlObj){
    KanbanTest = new jKanban({
    element: "#myKanban",
    gutter: "10px",
    widthBoard: "200px",
    itemHandleOptions:{
      enabled: true,
    },
    click: function(el) {
      console.log("Trigger on all items click!");
    },
    context: function(el, e) {
      console.log("Trigger on all items right-click!");
    },
    dropEl: function(el, target, source, sibling){
      console.log(target.parentElement.getAttribute('data-id'));
      console.log(el, target, source, sibling)
      updateYamlFromBoard();
    },
    dropBoard: function(el, target, source, sibling){
        console.log(target.parentElement.getAttribute('data-id'));
        console.log(el, target, source, sibling)
        updateYamlFromBoard();
      },
    buttonClick: function(el, boardId) {
      // TODO Fix this so it is updated from the YAML list of workflows
      let workflow_keys = Object.keys(yamlObj.workflows);
      let selectHTML = '<select class="bitriseSelect">';
      workflow_keys.forEach((workflow)=>{
          selectHTML += '<option value="'+workflow+'">'+workflow+'</option>';
      });
      selectHTML += '</select>';
      addWorkflow(boardId, selectHTML);
    },
    itemAddOptions: {
      enabled: true,
      content: '+',
      class: 'custom-button',
      footer: true
    }, 
    itemHandleOptions: {
        enabled: true
    },
    boards: boards
  });
}

/* Util Functions */

function isUniquePipelineName(name){
  let yaml = parseYaml();
  if(!yaml.pipelines){
    return true;
  }
  let isUnique = true;
  Object.keys(yaml.pipelines).forEach((board)=>{
    if(name == board){
      isUnique = false;
    }
  });
  return isUnique;
}

function isUniqueStageNameForBoard(name){
  let yaml = parseYaml();
  if(!yaml.pipelines[selectedPipeline] || !yaml.pipelines[selectedPipeline].stages){
    return true;
  }
  let isUnique = true;
  let stages = yaml.pipelines[selectedPipeline].stages.map((stage)=>Object.keys(stage)[0]);
  if(stages.indexOf(name) != -1){
      isUnique = false;
  }
  return isUnique;
}

function renderJSON(){
  const obj = document.getElementById("myKanban");
  let boards = []
  obj.querySelectorAll('.kanban-board').forEach(el => {
      let items = []
      el.querySelectorAll('.kanban-item').forEach(i => {
        let id = i.getAttribute('data-eid');
        let newId = id.substring(0, id.indexOf('|'));
          items.push({
              id: newId,
          })
      })
      boards.push({
          id: el.getAttribute('data-id'),
          title: el.getAttribute('data-id'),
          items,
      })
  })
  return boards
}

function updateYamlFromBoard(newPipeline){
  var originalYaml = editor.getValue();
  let obj = jsYaml.load(originalYaml, { schema: jsYaml.DEFAULT_SCHEMA });
  let newPipelineStages = [];
  let newStageWorkflowsObjs = {};
  let boards = renderJSON();
  boards.forEach((board)=>{
    let newStageWorkflows = [];
    board.items.forEach((wf)=>{
      let workflowObj = {};
      workflowObj[wf.id] = {};
      newStageWorkflows.push(workflowObj);
    });
    let stageObj = {};
    stageObj[board.id] = {};
    newPipelineStages.push(stageObj);
    newStageWorkflowsObjs[board.id] = {
      workflows: newStageWorkflows
    };
  })
  if(newPipeline){
    if(!obj.pipelines){
      obj.pipelines = {};
    }
    obj.pipelines[newPipeline] = {stages: []}
  }
  obj.pipelines[selectedPipeline].stages = newPipelineStages;
  obj.stages = {
    ...obj.stages, 
    ...newStageWorkflowsObjs
  };
  checkForErrors(obj);
  let yaml = jsYaml.dump(obj);
  let newYaml = replacePipelinesAndStages(originalYaml, yaml);
  editor.getModel().setValue(newYaml);
}

function checkForErrors(obj){
  let errors = '';
  Object.keys(obj.pipelines).forEach((pipeline)=>{
    // Validate Pipelines have at least 1 stage
    if(obj.pipelines[pipeline].stages.length == 0){
      errors += 'Error: Pipeline "' + pipeline + '" does not have any stages!<br>';
    }
  });
  // Validate Stages have at least 1 workflow
  Object.keys(obj.stages).forEach((stage)=>{
    if(Object.keys(obj.stages[stage].workflows).length == 0){
      errors += 'Error: Stage "' + stage + '" does not have any workflows!<br>';
    }
  });
  document.getElementById('errors').innerHTML = errors;
}
function replacePipelinesAndStages(originalYaml, newYaml){
  let projectTypeStr = 'project_type:';
  let pipelineStr = 'pipelines:';
  let stageStr = 'stages:';
  let parsingPipelines = false;
  let parsingStages = false;
  let pipelinesLines = '';
  let stagesLines = '';
  newYaml.split('\n').forEach((line)=>{
    // New section detected
    if(line.indexOf(' ') != 0) {
      parsingPipelines = false;
      parsingStages = false;
    }
    if(line.indexOf(pipelineStr) == 0) {
      parsingPipelines = true;
    }
    if(line.indexOf(stageStr) == 0) {
      parsingStages = true;
    }
    if(parsingPipelines) {
      pipelinesLines += line + '\n';
    }
    if(parsingStages) {
      stagesLines += line + '\n';
    }
  });
  // Fix indent issue
  pipelinesLines = pipelinesLines.replace(/      +/g, '    ');
  stagesLines = stagesLines.replace(/      +/g, '    ');

  console.log('pipelinesLines:', pipelinesLines);
  console.log('stagesLines:', stagesLines);

  let mergedLines = [];
  originalYaml.split('\n').forEach((line)=>{
    // New section detected
    if(line.indexOf(' ') != 0) {
      parsingPipelines = false;
      parsingStages = false;
    }
    if(line.indexOf(pipelineStr) == 0) {
      parsingPipelines = true;
      mergedLines.push(line);
    }
    if(line.indexOf(stageStr) == 0) {
      parsingStages = true;
      mergedLines.push(line);
    }
    if(!parsingPipelines && !parsingStages) {
      mergedLines.push(line);
    }
  });

  let mergedYaml = '';
  mergedLines.forEach((line, index)=>{
    if(originalYaml.indexOf(pipelineStr) != -1 && originalYaml.indexOf(stageStr) != -1){
      if(line.indexOf(pipelineStr) == 0 ){
        mergedYaml += pipelinesLines;
      } else if(line.indexOf(stageStr) == 0) {
        mergedYaml += stagesLines;
      } else {
        mergedYaml += line + (index != mergedLines.length-1 ? '\n' : '');
      }
    } else {
      if(line.indexOf(projectTypeStr) == 0 ){
        mergedYaml += line + '\n';
        mergedYaml += pipelinesLines;
        mergedYaml += stagesLines;
      } else {
        mergedYaml += line + (index != mergedLines.length-1 ? '\n' : '');
      }
    }
  });

  return mergedYaml;
}

function removeAllBoards(){
  let boards = renderJSON();
  boards.forEach((board)=>{
    KanbanTest.removeBoard(board.id);
  });
}

// Hack to make this global
window.parseYaml = () => {
  var str, obj;

  str = editor.getValue();

  try {
    obj = jsYaml.load(str, { schema: jsYaml.DEFAULT_SCHEMA });
  } catch (err) {
    console.log(err);
  }
  return obj;
}

function download() {
  let text = editor.getValue();
  let fileName = 'bitrise.yml';
  const blob = new Blob([text], { type: "text/plain" });
  const downloadLink = document.createElement("a");
  downloadLink.download = fileName;
  downloadLink.innerHTML = "Download File";
  if (window.webkitURL) {
      // No need to add the download element to the DOM in Webkit.
      downloadLink.href = window.webkitURL.createObjectURL(blob);
  } else {
      downloadLink.href = window.URL.createObjectURL(blob);
      downloadLink.onclick = (event) => {
          if (event.target) {
              document.body.removeChild(event.target);
          }
      };
      downloadLink.style.display = "none";
      document.body.appendChild(downloadLink);
  }

  downloadLink.click();

  if (window.webkitURL) {
      window.webkitURL.revokeObjectURL(downloadLink.href);
  } else {
      window.URL.revokeObjectURL(downloadLink.href);
  }
};

function loadEditor(){
  window.editor = monaco.editor.create(document.getElementById('container'), {
        value: [`format_version: '8'
default_step_lib_source: https://github.com/bitrise-io/bitrise-steplib.git
project_type: ios
pipelines:
  pipeline_1:
    stages:
    - build: {}
    - test: {}
    - deploy: {}
  pipeline_2:
    stages:
    - build: {}
    - test: {}
  pipeline_3:
    stages:
    - build_parallel: {}
stages:
  build:
    workflows:
    - build: {}
  test:
    workflows:
    - tests_1: {}
    - tests_2: {}
    - tests_3: {}
    - tests_4: {}
    - tests_5: {}
  deploy:
    workflows:
    - deploy: {}
  build_parallel:
    workflows:
    - ios: {}
    - android: {}
workflows:
  build:
    steps:
      - activate-ssh-key@4:
          run_if: '{{getenv "SSH_RSA_PRIVATE_KEY" | ne ""}}'
      - git-clone@6: {}
  tests_1:
    steps:
      - activate-ssh-key@4:
          run_if: '{{getenv "SSH_RSA_PRIVATE_KEY" | ne ""}}'
      - git-clone@6: {}
  tests_2:
    steps:
      - activate-ssh-key@4:
          run_if: '{{getenv "SSH_RSA_PRIVATE_KEY" | ne ""}}'
      - git-clone@6: {}
  tests_3:
    steps:
      - activate-ssh-key@4:
          run_if: '{{getenv "SSH_RSA_PRIVATE_KEY" | ne ""}}'
      - git-clone@6: {}
  tests_4:
    steps:
      - activate-ssh-key@4:
          run_if: '{{getenv "SSH_RSA_PRIVATE_KEY" | ne ""}}'
      - git-clone@6: {}
  tests_5:
    steps:
      - activate-ssh-key@4:
          run_if: '{{getenv "SSH_RSA_PRIVATE_KEY" | ne ""}}'
      - git-clone@6: {}
  deploy:
    steps:
      - activate-ssh-key@4:
          run_if: '{{getenv "SSH_RSA_PRIVATE_KEY" | ne ""}}'
      - git-clone@6: {}
  ios:
    steps:
      - activate-ssh-key@4:
          run_if: '{{getenv "SSH_RSA_PRIVATE_KEY" | ne ""}}'
      - git-clone@6: {}
  android:
    steps:
      - activate-ssh-key@4:
          run_if: '{{getenv "SSH_RSA_PRIVATE_KEY" | ne ""}}'
      - git-clone@6: {}
`].join('\n'),
        language: 'yaml',
        automaticLayout: true
      });
      monaco.editor.setTheme('vs-dark');
}