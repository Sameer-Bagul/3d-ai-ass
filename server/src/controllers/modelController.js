const finetuneJobs = new Map();

exports.handleFinetune = async (req, res) => {
  try {
    const { datasetId, type = 'lora', params = {} } = req.body;
    
    if (!datasetId) {
      return res.status(400).json({ error: 'Dataset ID is required' });
    }
    
    const jobId = `ft_${Date.now()}`;
    
    finetuneJobs.set(jobId, {
      datasetId,
      type,
      params,
      status: 'queued',
      createdAt: new Date().toISOString()
    });
    
    console.log(`🔧 Fine-tune job queued: ${jobId}`);
    
    res.json({
      status: 'queued',
      jobId: jobId,
      message: 'Fine-tuning job has been queued'
    });
  } catch (error) {
    console.error('Fine-tune error:', error);
    res.status(500).json({ error: 'Fine-tuning failed' });
  }
};

exports.getModels = (req, res) => {
  const models = [
    {
      id: 'mistral-base',
      name: 'Mistral Base',
      status: 'available',
      description: 'Base Mistral model via Ollama'
    },
    {
      id: 'mistral-avatar-tuned',
      name: 'Mistral Avatar-Tuned',
      status: 'training',
      description: 'Fine-tuned for avatar animation control'
    }
  ];
  
  res.json({
    models,
    finetuneJobs: Array.from(finetuneJobs.entries()).map(([id, job]) => ({
      jobId: id,
      ...job
    }))
  });
};
