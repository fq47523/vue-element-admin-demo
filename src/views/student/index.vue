<template>
  <div class="app-container">
    <div class="filter-container">
      <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreate">
        Add
      </el-button>
      <!--
      <el-button v-waves :loading="downloadLoading" class="filter-item" type="primary" icon="el-icon-download" @click="handleDownload">
        Export
      </el-button>
      -->
    </div>

    <el-table
      :key="tableKey"
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%;"
    >
      <el-table-column label="ID" prop="id" sortable="custom" align="center" width="80">
        <template slot-scope="{row}">
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Name" width="150px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.student_name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Code" width="150px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.id_card.num }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Class" width="150px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.class.class_name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Teachers" width="150px" align="center">
        <template slot-scope="{row}">
          <span v-for="(name,i) in row.teachers" :key="i">{{ name.teacher_name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Actions" align="center" width="230" class-name="small-padding fixed-width">
        <template slot-scope="{row,$index}">
          <el-button type="primary" size="mini" @click="handleUpdate(row)">
            Edit
          </el-button>
          <el-button v-if="row.status!='deleted'" size="mini" type="danger" @click="handleDelete(row,$index)">
            Delete
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getSTudent" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="70px" style="width: 400px; margin-left:50px;">
        <el-form-item label="姓名" prop="student_name">
          <el-input v-model="temp.student_name" />
        </el-form-item>
        <el-form-item label="班级" prop="class_id">
          <!-- <el-input v-model="temp.class_id" /> -->
          <el-select v-model="temp.class_id" clearable placeholder="请选择">
            <el-option
              v-for="item in classlist"
              :key="item.id"
              :label="item.class_name"
              :value="item.id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="身份证" prop="id_card">
          <el-input v-model="temp.id_card.num" />
        </el-form-item>
        <el-form-item label="老师" prop="teacher_id">
          <el-select v-model="temp.teachers" multiple  placeholder="请选择">
            <el-option
              v-for="item in teacherlist"
              :key="item.id"
              :label="item.teacher_name"
              :value="item.id">
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">
          Cancel
        </el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">
          Confirm
        </el-button>
      </div>
    </el-dialog>
    <el-dialog
      :title="textMap[dialogStatus]"
      :visible.sync="dialogDeleteVisible"
      width="30%"
      :before-close="handleClose">
      <span>确定需要删除这条数据吗</span>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogDeleteVisible = false">取 消</el-button>
        <el-button type="primary" @click="deleteData()" >确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { queryStudentList,queryClassList,queryTeacherList,createStudent,updateStudent,deleteStudent } from '@/api/student'
import waves from '@/directive/waves' // waves directive
import { parseTime } from '@/utils'
import Pagination from '@/components/Pagination' // secondary package based on el-pagination

const calendarTypeOptions = [
  { key: 'CN', display_name: 'China' },
  { key: 'US', display_name: 'USA' },
  { key: 'JP', display_name: 'Japan' },
  { key: 'EU', display_name: 'Eurozone' }
]

// arr to obj, such as { CN : "China", US : "USA" }
const calendarTypeKeyValue = calendarTypeOptions.reduce((acc, cur) => {
  acc[cur.key] = cur.display_name
  return acc
}, {})

export default {
  name: 'ComplexTable',
  components: { Pagination },
  directives: { waves },
  filters: {
    statusFilter(status) {
      const statusMap = {
        published: 'success',
        draft: 'info',
        deleted: 'danger'
      }
      return statusMap[status]
    },
    typeFilter(type) {
      return calendarTypeKeyValue[type]
    }
  },
  data() {
    return {
      tableKey: 0,
      list: null,
      classlist:null,
      teacherlist:null,
      total: 0,
      listLoading: true,
      listQuery: {
        page: 1,
        limit: 10,
        importance: undefined,
        title: undefined,
        type: undefined,
        sort: '+id'
      },
      importanceOptions: [1, 2, 3],
      calendarTypeOptions,
      sortOptions: [{ label: 'ID Ascending', key: '+id' }, { label: 'ID Descending', key: '-id' }],
      statusOptions: ['published', 'draft', 'deleted'],
      showReviewer: false,
      temp: {
        id: undefined,
        student_name: '',
        class_id: undefined,
        id_card: {'num':undefined},
        teachers: []
      },
      deletedata: {
        data:undefined,
        eltableindex:undefined
      },
      dialogFormVisible: false,
      dialogDeleteVisible: false,
      dialogStatus: '',
      textMap: {
        update: 'Edit',
        create: 'Create',
        delete: 'Delete'
      },
      dialogPvVisible: false,
      pvData: [],
      rules: {
        type: [{ required: true, message: 'type is required', trigger: 'change' }],
        timestamp: [{ type: 'date', required: true, message: 'timestamp is required', trigger: 'change' }],
        title: [{ required: true, message: 'title is required', trigger: 'blur' }]
      },
      downloadLoading: false
    }
  },
  created() {
    this.getSTudent()
    this.getClass()
    this.getTeacher()
  },
  methods: {
    getSTudent() {
      this.listLoading = true
      queryStudentList(this.listQuery).then(response => {
        this.list = response.data.items
        this.total = response.data.total
        
        // Just to simulate the time of the request
        setTimeout(() => {
          this.listLoading = false
        }, 1.5 * 1000)
      })
    },
    getClass(){
      queryClassList(this.listQuery).then(response => {
        this.classlist = response.data.items
        
        // Just to simulate the time of the request
        setTimeout(() => {
          this.listLoading = false
        }, 1.5 * 1000)
      })
    },
    getTeacher(){
      queryTeacherList(this.listQuery).then(response => {
        this.teacherlist = response.data.items
        
        // Just to simulate the time of the request
        setTimeout(() => {
          this.listLoading = false
        }, 1.5 * 1000)
      })
    },
    resetTemp() {
      this.temp = {
        id: undefined,
        student_name: '',
        class_id: undefined,
        id_card: {'num':undefined},
        teachers: []
      }
    },
    handleCreate() {
      this.resetTemp()
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
      
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    createData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          this.temp.class_id = Number(this.temp.class_id)
          this.temp.id_card.num = Number(this.temp.id_card.num)
          let tempTeacherId = []
          for(let i in this.temp.teachers ){
            tempTeacherId.push({'id':this.temp.teachers[i]})
          }
          this.temp.teachers = tempTeacherId
          createStudent(this.temp).then(() => {
            //this.list.unshift(this.temp)
            this.getSTudent()
            this.dialogFormVisible = false
            this.$notify({
              title: 'Success',
              message: 'Created Successfully',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    handleUpdate(row) {
      this.temp = Object.assign({}, row) // copy obj
      let tempTeacherId = []  // fmt teacherData
      for(let i in this.temp.teachers ){
        tempTeacherId.push(this.temp.teachers[i]['id'])
      }
      this.temp.teachers = tempTeacherId
     
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          this.temp.class_id = Number(this.temp.class_id)
          this.temp.id_card.num = Number(this.temp.id_card.num)
          let tempTeacherId = []
          for(let i in this.temp.teachers ){
            tempTeacherId.push({'id':this.temp.teachers[i]})
          }
          this.temp.teachers = tempTeacherId
          delete this.temp["class"]
          const tempData = Object.assign({}, this.temp)
          updateStudent(tempData).then(() => {
            // const index = this.list.findIndex(v => v.id === this.temp.id)
            // this.list.splice(index, 1, this.temp)
            this.getSTudent()
            this.dialogFormVisible = false
            this.$notify({
              title: 'Success',
              message: 'Update Successfully',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    handleDelete(row,index) {
      this.dialogStatus = 'delete'
      this.dialogDeleteVisible = true
      this.deletedata.data = row
      this.deletedata.eltableindex = index
    },
    deleteData(){
      deleteStudent(this.deletedata.data).then(() =>{
        this.dialogDeleteVisible = false
        this.$notify({
          title: 'Success',
          message: 'Delete Successfully',
          type: 'success',
          duration: 2000
        })
        this.list.splice(this.deletedata.eltableindex, 1)
      }
      )
    },
    handleClose(done) {
      this.$confirm('确认关闭？')
        .then(_ => {
          done();
        })
        .catch(_ => {});
    },
  }
}
</script>
