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

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  aCopy = [...a];
  bCopy = [...b];

  for (var i = 0; i < aCopy.length; ++i) {
    if (aCopy[i] !== bCopy[i]) return false;
  }
  return true;
}