# Mastra Cloud Deployment Guide

## 🌟 **Project Status: Cloud-Ready ✅**

Your TASC SEO Agent project is **perfectly structured** for Mastra Cloud deployment and will be automatically detected!

## 📋 **Quick Deployment Checklist**

### ✅ **Already Complete**
- [x] **Perfect project structure** (`src/mastra/` with agents, tools, workflows)
- [x] **5 specialized agents** (Research, Structure, Content, Optimization, Orchestrator)  
- [x] **6+ tools** (Article manager, SEO analyzer, research tools)
- [x] **3 workflows** (SEO article workflow, blog research, weather)
- [x] **GitHub repository** connected at `tasc-outsourcing/seo-agent-mastra`
- [x] **Main configuration** (`src/mastra/index.ts`) properly exports everything

## 🚀 **Deploy to Mastra Cloud**

### **Step 1: Access Cloud Dashboard**
```
🌐 Go to: https://cloud.mastra.ai
🔑 Sign in with your GitHub account
```

### **Step 2: Create Project**
1. Click **"Create new project"**
2. **Import repository**: Search for `tasc-outsourcing/seo-agent-mastra`
3. Click **"Import"**

### **Step 3: Configure Settings**

**📁 Project Configuration:**
- **Branch**: `main`
- **Project Root**: `./` (root directory)
- **Mastra Directory**: `./src/mastra` (auto-detected)

**🔑 Environment Variables** (Add in Mastra Cloud dashboard):
```bash
# AI Functionality (Required)
OPENAI_API_KEY=sk-your_openai_api_key

# Enhanced Web Search (Required)
EXA_API_KEY=your_exa_api_key

# Database 
DATABASE_URL=file:./storage.db

# Authentication (Optional - for full-stack features)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_key
```

**⚙️ Build Configuration:**
- **Build Command**: `npm install` (auto-detected)
- **Start Command**: `mastra dev --dir ./src/mastra`

### **Step 4: Deploy**
1. Click **"Deploy Project"**
2. ⏱️ Wait 2-3 minutes for deployment
3. 🎉 Your agents will be live!

## 🎯 **What Gets Deployed**

### **🤖 Auto-Detected Agents**
```typescript
✅ seoOrchestratorAgent    - Coordinates 15-phase workflow
✅ seoResearchAgent        - Phases 1-3: Research & analysis  
✅ seoStructureAgent       - Phases 4-6: Structure & planning
✅ seoContentAgent         - Phases 7-8: Content creation
✅ seoOptimizationAgent    - Phases 9-15: Optimization & polish
✅ blogArticleAgent        - Original blog creation agent
✅ weatherAgent            - Example weather agent
```

### **🛠️ Auto-Detected Tools**
```typescript
✅ articleFileManagerTool  - File system management
✅ seoAnalyzerTool         - Yoast-style SEO scoring
✅ blogResearchTool        - Research capabilities
✅ tascContextTool         - TASC guidelines integration
✅ tascWebSearchTool       - Web search functionality
✅ tascDeepResearchTool    - Advanced research
```

### **🔄 Auto-Detected Workflows**
```typescript
✅ seoArticleWorkflow      - 15-phase SEO article creation
✅ blogResearchWorkflow    - Human-in-loop research  
✅ weatherWorkflow         - Example weather workflow
```

## 🎮 **Testing Your Deployment**

### **1. Mastra Cloud Playground**
After deployment, test your agents directly:
- Navigate to **Playground** in Mastra Cloud dashboard
- Select any agent (e.g., `seoOrchestratorAgent`)
- Test with sample input: `"AI tools for content marketing"`

### **2. Workflow Testing**
Test the complete SEO workflow:
- **Workflow**: `seoArticleWorkflow`
- **Input**: 
  ```json
  {
    "userInput": "business setup in saudi arabia",
    "articleType": "informational",
    "targetAudience": "entrepreneurs"
  }
  ```

### **3. Monitor Execution**
- View **real-time logs** in dashboard
- Track **execution steps** through workflow
- Debug any issues with **detailed traces**

## 📊 **Cloud Features You'll Get**

### **🔄 Continuous Integration**
- **Auto-deploy** on every GitHub push to `main`
- **Atomic deployments** - all agents/tools updated together
- **Rollback capability** if issues arise

### **📈 Monitoring & Observability**
- **Real-time execution logs**
- **Performance metrics**
- **Error tracking and debugging**
- **Usage analytics**

### **🔧 Management Dashboard**
- **Environment variable management**
- **Deployment history**
- **Agent/tool configuration**
- **Workflow execution monitoring**

## 🚨 **Troubleshooting**

### **Common Issues**

**1. Build Fails**
```bash
# Test locally first
npm run dev:mastra

# Check mastra configuration
mastra dev --dir ./src/mastra
```

**2. Agents Not Detected**
- Verify `src/mastra/index.ts` exports all agents
- Check agent definitions use `new Agent({...})`
- Ensure proper imports in main configuration

**3. Environment Variables**
- Add required variables in Mastra Cloud dashboard
- Verify OpenAI API key is valid
- Check database URL format

### **Debug Commands**
```bash
# Local testing
npm run dev:mastra

# Verify exports
node -e "console.log(require('./src/mastra/index.js'))"

# Check build
npm run build
```

## 🎉 **Success Metrics**

After successful deployment, you should see:

✅ **5+ agents** detected and active  
✅ **6+ tools** available in playground  
✅ **3 workflows** ready for execution  
✅ **Auto-deployment** working on Git pushes  
✅ **Monitoring dashboard** showing activity  

## 🔗 **Next Steps**

1. **Deploy to cloud.mastra.ai** using steps above
2. **Test agents** in Mastra Cloud Playground  
3. **Monitor execution** with dashboard tools
4. **Integrate via API** with your applications
5. **Scale usage** based on demand

## 💡 **Pro Tips**

- **Start simple**: Test one agent first, then expand
- **Monitor logs**: Use dashboard for debugging
- **Version control**: Each Git push creates new deployment
- **Environment sync**: Keep local/cloud env vars in sync
- **API integration**: Use Mastra Client SDK for external integration

Your TASC SEO Agent system is now ready for enterprise-scale deployment on Mastra Cloud! 🚀