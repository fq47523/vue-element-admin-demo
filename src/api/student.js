import request from '@/utils/request'

export function queryStudentList(query) {
  return request({
    url: '/student/list',
    method: 'get',
    params: query
  })
}

export function queryClassList(query) {
  return request({
    url: '/student/class/list',
    method: 'get',
    params: query
  })
}

export function queryTeacherList(query) {
  return request({
    url: '/student/teacher/list',
    method: 'get',
    params: query
  })
}

export function createStudent(data) {
  return request({
    url: '/student/create',
    method: 'post',
    data
  })
}

export function updateStudent(data) {
  return request({
    url: '/student/update',
    method: 'post',
    data
  })
}

export function deleteStudent(data) {
  return request({
    url: '/student/delete',
    method: 'post',
    data
  })
}