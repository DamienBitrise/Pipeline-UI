let KanbanTest = null;
let selectedPipeline = null;
window.onload = function () {
  default_text = document.getElementById('source').value || '';

  // Parse the YAML in the text editor
  loadYaml(parseYaml());

  var sourceElm = document.getElementById("source");
  sourceElm.addEventListener("input", function() {
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

  var addStageElm = document.getElementById("addStage");
  addStageElm.addEventListener("click", function() {
    let name = document.getElementById('stage_name').value;
    if(name == ''){
      alert('Error: You must enter a stage name!');
    } else if(!isUniqueStageName(name)) {
      alert('Error: You must enter a unique stage name!');
    } else {
      KanbanTest.addBoards([
        {
          id: name,
          title: name + '<input id="delete_'+name+'" class="delete" type="button" value="X" onclick="deleteStage(\''+name+'\')">',
          item: [],
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
      // let yaml = parseYaml();
      // loadYaml(yaml);
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
            pipeline_stage_workflows_keys.forEach((workflow)=>{
                board_stages.push({
                    id: workflow,
                    title: '<div class="workflow-title">'+workflow + '</div><div class="workflow-delete"><input id="delete_'+workflow+'" class="delete" type="button" value="X" onclick="deleteWorkflow(\''+workflow+'\')"></div>',
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
        <button type="submit" class="btn btn-primary btn-xs pull-right">Add</button>
        <button type="button" id="CancelBtn" class="btn btn-default btn-xs pull-right">Cancel</button>
    </div>`;

  KanbanTest.addForm(boardId, formItem);
  formItem.addEventListener("submit", function(e) {
    e.preventDefault();
    var workflow = e.target[0].value;
    KanbanTest.addElement(boardId, {
      id: workflow,
      title: '<div class="workflow-title">'+workflow + '</div><div class="workflow-delete"><input id="delete_'+workflow+'" class="delete" type="button" value="X" onclick="deleteWorkflow(\''+workflow+'\')"></div>',
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
      let selectHTML = '<select>';
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

function isUniqueStageName(name){
  let yaml = parseYaml();
  if(!yaml.stages){
    return true;
  }
  let isUnique = true;
  Object.keys(yaml.stages).forEach((stage)=>{
    if(name == stage){
      isUnique = false;
    }
  });
  return isUnique;
}

function renderJSON(){
  const obj = document.getElementById("myKanban");
  let boards = []
  obj.querySelectorAll('.kanban-board').forEach(el => {
      let items = []
      el.querySelectorAll('.kanban-item').forEach(i => {
          items.push({
              id: i.getAttribute('data-eid'),
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
  var originalYaml = document.getElementById("source").value;
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
  let yaml = jsYaml.dump(obj);
  let newYaml = replacePipelinesAndStages(originalYaml, yaml);
  document.getElementById("source").value = newYaml;
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