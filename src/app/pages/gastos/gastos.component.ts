import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ChartModule } from 'primeng/chart';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../core/services/auth.service';
import { CuentaService } from '../../core/services/cuenta.service';
import { GastoService } from '../../core/services/gasto.service';
import { IngresoService } from '../../core/services/ingreso.service';
import { CuentaResponse, GastoResponse, IngresoResponse } from '../../core/models/api.models';

@Component({selector:'app-gastos',standalone:true,imports:[ReactiveFormsModule,DatePipe,DecimalPipe,TableModule,ButtonModule,DialogModule,InputTextModule,InputNumberModule,SelectModule,DatePickerModule,ChartModule,MessageModule],template:`
<section class="page">
 <div class="page-header"><div><h1>Gastos</h1><p class="muted">Registra gastos y controla su impacto en tus cuentas e ingresos.</p></div><p-button label="Nuevo gasto" icon="pi pi-plus" (onClick)="openNew()"/></div>
 @if(errorMessage){<p-message severity="error" styleClass="w-full mb-3">{{errorMessage}}</p-message>}
 <div class="grid grid-2"><div class="card"><h3>Promedio mensual por categoría</h3><p-chart type="bar" [data]="averageChart" [options]="chartOptions"/></div><div class="card"><h3>Resumen</h3><div class="stat-value">S/ {{total|number:'1.2-2'}}</div><div class="muted">Total de gastos cargados</div></div></div>
 <div class="card" style="margin-top:1rem"><p-table [value]="rows" [loading]="loading"><ng-template #header><tr><th>Fecha</th><th>Cuenta</th><th>Categoría</th><th>Monto</th><th>Descripción</th><th>Acciones</th></tr></ng-template><ng-template #body let-row><tr><td>{{row.item.fecha|date:'dd/MM/yyyy'}}</td><td>{{accountName(row.item.idCuenta)}}</td><td>{{row.item.categoria}}</td><td>S/ {{row.item.monto|number:'1.2-2'}}</td><td>{{row.item.descripcion}}</td><td><p-button icon="pi pi-pencil" [text]="true" (onClick)="edit(row.item)"/></td></tr></ng-template><ng-template #emptymessage><tr><td colspan="6">No hay gastos.</td></tr></ng-template></p-table></div>
 <p-dialog [(visible)]="dialogVisible" [header]="editing?'Editar gasto':'Nuevo gasto'" [modal]="true" [style]="{width:'min(700px,95vw)'}">
  <form [formGroup]="form" (ngSubmit)="save()"><div class="form-grid">
   <div class="field"><label>Cuenta</label><p-select formControlName="idCuenta" [options]="cuentas" optionLabel="nombreCuenta" optionValue="id" appendTo="body" [disabled]="!!editing"/></div>
   <div class="field"><label>Fecha</label><p-datepicker formControlName="fecha" dateFormat="yy-mm-dd" [showIcon]="true" appendTo="body"/></div>
   <div class="field"><label>Monto</label><p-inputnumber formControlName="monto" (onFocus)="selectMoneyInput($event)" mode="decimal" prefix="S/ " [minFractionDigits]="2"/></div>
   <div class="field"><label>Categoría</label><input pInputText formControlName="categoria" list="categorias-gasto" placeholder="Selecciona o escribe una categoría"/><datalist id="categorias-gasto">@for(c of categorias;track c){<option [value]="c"></option>}</datalist></div>
   <div class="field full"><label>Descripción</label><input pInputText formControlName="descripcion"/></div>
  </div>
  @if(selectedAccount){<div class="card" style="margin-top:1rem"><strong>{{selectedAccount.nombreCuenta}}</strong><div class="muted">Saldo disponible: S/ {{availableForExpense|number:'1.2-2'}} · Saldo después del gasto: S/ {{balanceAfter|number:'1.2-2'}}</div></div>}
  @if(insufficientBalance){<p-message severity="error" styleClass="w-full mt-3">Saldo insuficiente. El gasto no puede superar los S/ {{availableForExpense|number:'1.2-2'}} disponibles en la cuenta.</p-message>}
  @if(!editing && monthlyIncome===0){<p-message severity="warn" styleClass="w-full mt-3">No tienes ingresos registrados para el mes seleccionado. Este gasto se descontará del saldo acumulado de la cuenta.</p-message>}
  @if(!editing && monthlyIncome>0 && projectedMonthlyExpenses>monthlyIncome){<p-message severity="warn" styleClass="w-full mt-3">Con este gasto superarías tus ingresos del mes en S/ {{projectedMonthlyExpenses-monthlyIncome|number:'1.2-2'}}. Ingresos: S/ {{monthlyIncome|number:'1.2-2'}} · Gastos proyectados: S/ {{projectedMonthlyExpenses|number:'1.2-2'}}.</p-message>}
  @if(!editing && monthlyIncome>0 && projectedMonthlyExpenses<=monthlyIncome){<p-message severity="success" styleClass="w-full mt-3">El gasto se mantiene dentro de tus ingresos del mes. Disponible frente a ingresos: S/ {{monthlyIncome-projectedMonthlyExpenses|number:'1.2-2'}}.</p-message>}
  <div class="actions"><p-button label="Cancelar" [text]="true" type="button" (onClick)="dialogVisible=false"/><p-button label="Guardar" type="submit" [loading]="saving" [disabled]="form.invalid||saving||insufficientBalance"/></div></form>
 </p-dialog>
</section>`})
export class GastosComponent implements OnInit{
 private fb=inject(FormBuilder);private auth=inject(AuthService);private cuentasService=inject(CuentaService);private service=inject(GastoService);private ingresosService=inject(IngresoService);
 cuentas:CuentaResponse[]=[];rows:{item:GastoResponse}[]=[];ingresos:IngresoResponse[]=[];categorias:string[]=[];editing:GastoResponse|null=null;dialogVisible=false;loading=false;saving=false;errorMessage='';total=0;averageChart:any;chartOptions:any={responsive:true,maintainAspectRatio:false};
 readonly form=this.fb.nonNullable.group({idCuenta:[0,Validators.required],monto:[0,[Validators.required,Validators.min(.01)]],fecha:[new Date(),Validators.required],categoria:['',Validators.required],descripcion:['',Validators.required]});
 ngOnInit(){this.loadAccounts()}
 loadAccounts(){this.auth.resolveUserId().subscribe(id=>{if(!id)return;this.cuentasService.listarPorUsuario(id).subscribe({next:cuentas=>{this.cuentas=cuentas;this.loadRows();this.loadAverages(id);this.loadCategories(id);this.loadIncomes()},error:e=>this.errorMessage=e?.error?.mensaje??'No se pudieron cargar las cuentas.'})})}
 loadRows(){if(!this.cuentas.length){this.rows=[];this.total=0;return}this.loading=true;forkJoin(this.cuentas.map(c=>this.service.listarPorCuenta(c.id))).pipe(finalize(()=>this.loading=false)).subscribe({next:r=>{this.rows=r.flat().map(item=>({item})).sort((a,b)=>b.item.fecha.localeCompare(a.item.fecha));this.total=this.rows.reduce((s,x)=>s+Number(x.item.monto||0),0)},error:()=>this.errorMessage='No se pudieron cargar los gastos.'})}
 loadIncomes(){if(!this.cuentas.length){this.ingresos=[];return}forkJoin(this.cuentas.map(c=>this.ingresosService.listarPorCuenta(c.id))).subscribe({next:r=>this.ingresos=r.flat(),error:()=>this.ingresos=[]})}
 loadCategories(id:number){this.service.categorias(id).subscribe({next:r=>this.categorias=r.map(this.prettyCategory),error:()=>this.categorias=[]})}
 loadAverages(id:number){this.service.promedios(id).subscribe({next:d=>{const labels=Object.keys(d);this.averageChart={labels,datasets:[{label:'Promedio mensual',data:labels.map(x=>d[x])}]}},error:()=>this.averageChart={labels:[],datasets:[]}})}
 accountName(id:number){return this.cuentas.find(c=>c.id===id)?.nombreCuenta??`Cuenta #${id}`}
 get selectedAccount(){return this.cuentas.find(c=>c.id===this.form.getRawValue().idCuenta)}
 get availableForExpense(){const c=this.selectedAccount;if(!c)return 0;return Number(c.saldoActual||0)+(this.editing?.idCuenta===c.id?Number(this.editing.monto||0):0)}
 get balanceAfter(){return this.availableForExpense-Number(this.form.getRawValue().monto||0)}
 get insufficientBalance(){return Number(this.form.getRawValue().monto||0)>this.availableForExpense}
 private selectedMonth(){const d=this.form.getRawValue().fecha;return {y:d.getFullYear(),m:d.getMonth()}}
 get monthlyIncome(){const x=this.selectedMonth();return this.ingresos.filter(i=>{const d=new Date(i.fecha+'T00:00:00');return d.getFullYear()===x.y&&d.getMonth()===x.m}).reduce((s,i)=>s+Number(i.monto||0),0)}
 get monthlyExpenses(){const x=this.selectedMonth();return this.rows.filter(r=>{const d=new Date(r.item.fecha+'T00:00:00');return d.getFullYear()===x.y&&d.getMonth()===x.m&&r.item.id!==this.editing?.id}).reduce((s,r)=>s+Number(r.item.monto||0),0)}
 get projectedMonthlyExpenses(){return this.monthlyExpenses+Number(this.form.getRawValue().monto||0)}
 openNew(){this.editing=null;this.form.reset({idCuenta:this.cuentas[0]?.id??0,monto:0,fecha:new Date(),categoria:'',descripcion:''});this.dialogVisible=true}
 edit(i:GastoResponse){this.editing=i;this.form.reset({idCuenta:i.idCuenta,monto:i.monto,fecha:new Date(i.fecha+'T00:00:00'),categoria:i.categoria,descripcion:i.descripcion});this.dialogVisible=true}
 save(){if(this.form.invalid||this.insufficientBalance)return;const v=this.form.getRawValue(),fecha=this.fmt(v.fecha),categoria=this.prettyCategory(v.categoria);this.saving=true;this.errorMessage='';const req=this.editing?this.service.actualizar({id:this.editing.id,monto:v.monto,fecha,categoria,descripcion:v.descripcion,usuarioModificacion:this.auth.getUsername()}):this.service.registrar({monto:v.monto,fecha,categoria,descripcion:v.descripcion,idCuenta:v.idCuenta,usuarioCreacion:this.auth.getUsername()});req.pipe(finalize(()=>this.saving=false)).subscribe({next:()=>{this.dialogVisible=false;this.loadAccounts()},error:e=>this.errorMessage=e?.error?.mensaje??'No se pudo guardar el gasto.'})}
 private fmt(d:Date){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
 private prettyCategory(v:string){const s=(v||'').trim().replace(/\s+/g,' ');return s?s.charAt(0).toUpperCase()+s.slice(1).toLowerCase():s}

  selectMoneyInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    setTimeout(() => input?.select());
  }
}
